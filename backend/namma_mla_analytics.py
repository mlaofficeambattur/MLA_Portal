import openpyxl
from io import BytesIO
from datetime import datetime, timedelta
import uuid
from typing import Dict, List, Any, Optional
import db

def parse_excel_date(val: Any) -> Optional[datetime]:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    # If it is a date object (without time)
    if type(val).__name__ == 'date':
        return datetime.combine(val, datetime.min.time())
    
    val_str = str(val).strip()
    if not val_str:
        return None
    
    # Try various common string date formats
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y %H:%M", "%d-%b-%Y", "%d %b %Y"):
        try:
            return datetime.strptime(val_str, fmt)
        except ValueError:
            continue
    return None

def validate_excel_data(file_contents: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses and validates Excel rows for Namma MLA complaints import.
    Checks for required fields, duplicate IDs in sheet and database, and valid mobile numbers.
    """
    try:
        wb = openpyxl.load_workbook(BytesIO(file_contents), read_only=True, data_only=True)
        sheet = wb.active
        if not sheet:
            raise Exception("Excel file has no active sheet.")
    except Exception as e:
        raise Exception(f"Failed to read Excel file: {str(e)}")

    rows = []
    headers = []
    
    # Read sheet rows
    for row in sheet.iter_rows(values_only=True):
        if not headers:
            # First non-empty row serves as header
            if any(row):
                headers = [str(cell).strip() if cell is not None else "" for cell in row]
            continue
        if not any(cell is not None for cell in row):
            continue  # Skip completely empty rows
        
        row_dict = dict(zip(headers, row))
        rows.append(row_dict)

    if not rows:
        raise Exception("Excel file contains no data rows.")

    # Map headers to standard fields flexibly
    field_mapping = {}
    for h in headers:
        clean = h.strip().lower().replace("_", "").replace(" ", "").replace(":", "")
        if clean in ["complaintid", "id", "cid", "complaintno", "complaintnumber"]:
            field_mapping["complaint_id"] = h
        elif clean in ["title", "subject", "complaint"]:
            field_mapping["title"] = h
        elif clean in ["description", "details", "desc", "complaintdescription"]:
            field_mapping["description"] = h
        elif clean in ["category", "type", "complaintcategory"]:
            field_mapping["category"] = h
        elif clean in ["priority", "level", "urgency"]:
            field_mapping["priority"] = h
        elif clean in ["status", "state", "complaintstatus"]:
            field_mapping["status"] = h
        elif clean in ["user", "citizen", "citizenname", "name", "username"]:
            field_mapping["citizen_name"] = h
        elif clean in ["usermobile", "mobile", "phone", "phonenumber", "contact", "citizenmobile", "mobile_number", "mobile_no"]:
            field_mapping["mobile"] = h
        elif clean in ["wardnumber", "ward", "wardno"]:
            field_mapping["ward_number"] = h
        elif clean in ["assemblyconstituency", "constituency"]:
            field_mapping["constituency"] = h
        elif clean in ["city", "district"]:
            field_mapping["city"] = h
        elif clean in ["state"]:
            field_mapping["state_val"] = h
        elif clean in ["resolutionnote", "resolution", "note", "resolutiondetails"]:
            field_mapping["resolution_note"] = h
        elif clean in ["resolvedat", "resolutiondate", "resolveddate"]:
            field_mapping["resolved_at"] = h
        elif clean in ["createdat", "createddate", "date", "datetime", "complaintdate"]:
            field_mapping["created_at"] = h
        elif clean in ["assignee", "assignedofficer", "officer", "assignedto"]:
            field_mapping["assignee"] = h

    # Check for core required column mappings
    core_missing = []
    if "complaint_id" not in field_mapping:
        core_missing.append("Complaint ID")
    if "title" not in field_mapping:
        core_missing.append("Title")

    if core_missing:
        raise Exception(
            f"Excel is missing required column headers: {', '.join(core_missing)}. "
            f"Please verify headers match: 'Complaint ID' and 'Title'."
        )

    # Validate each row
    validated_rows = []
    sheet_seen_ids = set()
    db_existing_ids = set()

    # Collect all complaint_ids from the sheet to check database duplicates in a single query
    complaint_ids_to_check = []
    for r in rows:
        c_id_header = field_mapping["complaint_id"]
        c_id = str(r.get(c_id_header) or "").strip()
        if c_id:
            complaint_ids_to_check.append(c_id)

    if complaint_ids_to_check:
        with db.get_db_cursor() as cursor:
            # Query db for existing complaint IDs
            cursor.execute(
                "SELECT complaint_id FROM namma_mla_complaints WHERE complaint_id = ANY(%s);",
                (complaint_ids_to_check,)
            )
            rows_db = cursor.fetchall()
            db_existing_ids = {row_db[0] for row_db in rows_db}

    duplicate_count = 0
    invalid_count = 0
    valid_count = 0

    for idx, r in enumerate(rows, start=2):  # Start at 2 since row 1 is headers
        errors = []
        
        # Extract fields using mapped headers
        c_id = str(r.get(field_mapping.get("complaint_id")) or "").strip()
        title = str(r.get(field_mapping.get("title")) or "").strip()
        description = str(r.get(field_mapping.get("description")) or "").strip()
        category = str(r.get(field_mapping.get("category")) or "Other").strip()
        priority = str(r.get(field_mapping.get("priority")) or "Medium").strip()
        status_val = str(r.get(field_mapping.get("status")) or "Pending").strip()
        citizen_name = str(r.get(field_mapping.get("citizen_name")) or "").strip()
        mobile_val = str(r.get(field_mapping.get("mobile")) or "").strip()
        ward_val = str(r.get(field_mapping.get("ward_number")) or "").strip()
        constituency = str(r.get(field_mapping.get("constituency")) or "Ambattur").strip()
        city = str(r.get(field_mapping.get("city")) or "Chennai").strip()
        state = str(r.get(field_mapping.get("state_val")) or "Tamil Nadu").strip()
        resolution_note = str(r.get(field_mapping.get("resolution_note")) or "").strip()
        
        # Parse Dates
        created_at_raw = r.get(field_mapping.get("created_at"))
        resolved_at_raw = r.get(field_mapping.get("resolved_at"))
        
        created_at = parse_excel_date(created_at_raw) or datetime.utcnow()
        resolved_at = parse_excel_date(resolved_at_raw)
        
        assignee = str(r.get(field_mapping.get("assignee")) or "").strip()

        # Validations
        if not c_id:
            errors.append("Complaint ID is required.")
        if not title:
            errors.append("Title is required.")
        
        # Mobile number validation (if present, must be exactly 10 digits)
        clean_mobile = ""
        if mobile_val:
            clean_mobile = "".join(filter(str.isdigit, mobile_val))
            if len(clean_mobile) != 10:
                errors.append(f"Invalid mobile number format: '{mobile_val}'. Must be a 10-digit number.")
        
        # Duplicate checks
        is_duplicate = False
        if c_id:
            if c_id in sheet_seen_ids:
                errors.append(f"Duplicate Complaint ID '{c_id}' within the Excel sheet.")
                is_duplicate = True
            elif c_id in db_existing_ids:
                errors.append(f"Duplicate Complaint ID '{c_id}' already exists in the database.")
                is_duplicate = True
            else:
                sheet_seen_ids.add(c_id)

        # Decide row status
        if errors:
            if is_duplicate:
                row_status = "duplicate"
                duplicate_count += 1
            else:
                row_status = "invalid"
                invalid_count += 1
        else:
            row_status = "valid"
            valid_count += 1

        validated_rows.append({
            "row_index": idx,
            "status": row_status,
            "errors": errors,
            "data": {
                "complaint_id": c_id,
                "title": title,
                "description": description,
                "category": category,
                "priority": priority,
                "status": status_val,
                "citizen_name": citizen_name,
                "mobile": clean_mobile or mobile_val,
                "ward_number": ward_val,
                "constituency": constituency,
                "city": city,
                "state": state,
                "resolution_note": resolution_note,
                "resolved_at": resolved_at.isoformat() if resolved_at else None,
                "created_at": created_at.isoformat() if created_at else None,
                "assignee": assignee
            }
        })

    return {
        "success": True,
        "filename": filename,
        "summary": {
            "total_rows": len(rows),
            "valid_rows_count": valid_count,
            "duplicate_rows_count": duplicate_count,
            "invalid_rows_count": invalid_count
        },
        "rows": validated_rows
    }

def import_validated_data(rows_data: List[Dict[str, Any]], filename: str, admin_id: int) -> Dict[str, Any]:
    """
    Imports validated Excel rows into the database inside a single transaction.
    Logs the upload batch history. Prevents double-imports of existing complaint_ids.
    """
    upload_batch_id = str(uuid.uuid4())
    
    total_rows = len(rows_data)
    imported_rows = 0
    duplicate_rows = 0
    invalid_rows = 0
    
    inserted_complaints = []

    # Filter out valid rows to insert, keep counts of other categories
    valid_rows_to_insert = []
    for r in rows_data:
        status = r.get("status")
        if status == "valid":
            valid_rows_to_insert.append(r.get("data"))
        elif status == "duplicate":
            duplicate_rows += 1
        else:
            invalid_rows += 1

    if not valid_rows_to_insert:
        # Save batch upload log even if 0 rows imported
        with db.get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO namma_mla_uploads (
                    upload_batch_id, filename, total_rows, imported_rows, duplicate_rows, invalid_rows, uploaded_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s);
                """,
                (upload_batch_id, filename, total_rows, 0, duplicate_rows, invalid_rows, admin_id)
            )
        return {
            "success": True,
            "upload_batch_id": upload_batch_id,
            "summary": {
                "total": total_rows,
                "imported": 0,
                "duplicates": duplicate_rows,
                "invalid": invalid_rows
            }
        }

    # Execute insert in transaction
    with db.get_db_cursor() as cursor:
        # 1. Log the upload batch
        cursor.execute(
            """
            INSERT INTO namma_mla_uploads (
                upload_batch_id, filename, total_rows, imported_rows, duplicate_rows, invalid_rows, uploaded_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s);
            """,
            (upload_batch_id, filename, total_rows, len(valid_rows_to_insert), duplicate_rows, invalid_rows, admin_id)
        )
        
        # 2. Insert rows into namma_mla_complaints
        # We perform safety checks for database level duplicate prevention
        for c in valid_rows_to_insert:
            # Final database safety check: make sure complaint_id does not exist
            cursor.execute("SELECT id FROM namma_mla_complaints WHERE complaint_id = %s;", (c["complaint_id"],))
            if cursor.fetchone():
                duplicate_rows += 1
                continue
                
            created_at_dt = datetime.fromisoformat(c["created_at"]) if c["created_at"] else datetime.utcnow()
            resolved_at_dt = datetime.fromisoformat(c["resolved_at"]) if c["resolved_at"] else None
            
            cursor.execute(
                """
                INSERT INTO namma_mla_complaints (
                    complaint_id, title, description, category, priority, status,
                    citizen_name, mobile, ward_number, constituency, city, state,
                    resolution_note, resolved_at, created_at, assignee, imported_by, upload_batch_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, complaint_id;
                """,
                (
                    c["complaint_id"],
                    c["title"],
                    c.get("description"),
                    c.get("category", "Other"),
                    c.get("priority", "Medium"),
                    c.get("status", "Pending"),
                    c.get("citizen_name"),
                    c.get("mobile"),
                    c.get("ward_number"),
                    c.get("constituency", "Ambattur"),
                    c.get("city", "Chennai"),
                    c.get("state", "Tamil Nadu"),
                    c.get("resolution_note"),
                    resolved_at_dt,
                    created_at_dt,
                    c.get("assignee"),
                    admin_id,
                    upload_batch_id
                )
            )
            res = cursor.fetchone()
            inserted_complaints.append({"id": res[0], "complaint_id": res[1]})
            imported_rows += 1

    return {
        "success": True,
        "upload_batch_id": upload_batch_id,
        "summary": {
            "total": total_rows,
            "imported": imported_rows,
            "duplicates": duplicate_rows + (len(valid_rows_to_insert) - imported_rows),
            "invalid": invalid_rows
        }
    }

def build_filter_clause(filters: Dict[str, Any]) -> tuple:
    """Builds SQL WHERE clause and parameter list from global filters."""
    clauses = []
    params = []
    
    # Filter by created_at date range
    if filters.get("start_date"):
        clauses.append("created_at >= %s")
        params.append(datetime.fromisoformat(filters["start_date"]))
    if filters.get("end_date"):
        # Include the full day of end_date
        end_dt = datetime.fromisoformat(filters["end_date"])
        if end_dt.time() == datetime.min.time():
            end_dt = datetime.combine(end_dt.date(), datetime.max.time())
        clauses.append("created_at <= %s")
        params.append(end_dt)
        
    if filters.get("ward_number"):
        clauses.append("ward_number = %s")
        params.append(filters["ward_number"])
        
    if filters.get("category"):
        clauses.append("category = %s")
        params.append(filters["category"])
        
    if filters.get("status"):
        clauses.append("status = %s")
        params.append(filters["status"])
        
    if filters.get("priority"):
        clauses.append("priority = %s")
        params.append(filters["priority"])
        
    if filters.get("assignee"):
        clauses.append("assignee = %s")
        params.append(filters["assignee"])
        
    if filters.get("constituency"):
        clauses.append("constituency = %s")
        params.append(filters["constituency"])
        
    if filters.get("search_id"):
        clauses.append("complaint_id ILIKE %s")
        params.append(f"%{filters['search_id']}%")
        
    if filters.get("search_citizen"):
        clauses.append("(citizen_name ILIKE %s OR mobile ILIKE %s)")
        search_val = f"%{filters['search_citizen']}%"
        params.append(search_val)
        params.append(search_val)
        
    if filters.get("month"):
        try:
            clauses.append("EXTRACT(MONTH FROM created_at) = %s")
            params.append(int(filters["month"]))
        except ValueError:
            pass
        
    where_sql = " AND ".join(clauses)
    if where_sql:
        where_sql = "WHERE " + where_sql
        
    return where_sql, params

def get_analytics_data(filters: Dict[str, Any]) -> Dict[str, Any]:
    """Computes all required analytics metrics and aggregations in SQL."""
    where_sql, params = build_filter_clause(filters)
    
    kpis = {}
    trends = []
    categories = []
    priorities = []
    statuses = []
    assignee_workload = []
    wards = []
    constituencies = []
    monthly_comparison = {}
    resolution_times = []
    heatmap = []
    sankey = {"nodes": [], "links": []}
    
    with db.get_db_cursor() as cursor:
        # 1. KPI Cards
        # We execute a single query to retrieve all general metrics
        kpi_query = f"""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status NOT IN ('Resolved', 'Rejected') THEN 1 END) as open,
                COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved,
                COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
                COUNT(CASE WHEN priority IN ('High', 'Urgent') THEN 1 END) as high_priority,
                COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as this_month,
                AVG(CASE WHEN status = 'Resolved' AND resolved_at IS NOT NULL AND created_at IS NOT NULL 
                         THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/86400 END) as avg_resolution_time
            FROM namma_mla_complaints
            {where_sql}
        """
        cursor.execute(kpi_query, params)
        res = cursor.fetchone()
        if res:
            total = res[0] or 0
            kpis = {
                "total_complaints": total,
                "open_complaints": res[1] or 0,
                "resolved_complaints": res[2] or 0,
                "pending_complaints": res[3] or 0,
                "high_priority": res[4] or 0,
                "today_complaints": res[5] or 0,
                "this_week_complaints": res[6] or 0,
                "this_month_complaints": res[7] or 0,
                "avg_resolution_time_days": round(res[8], 1) if res[8] is not None else 0.0,
                "resolution_percent": round((res[2] / total * 100), 1) if total > 0 else 0.0
            }
        else:
            kpis = {
                "total_complaints": 0, "open_complaints": 0, "resolved_complaints": 0,
                "pending_complaints": 0, "high_priority": 0, "today_complaints": 0,
                "this_week_complaints": 0, "this_month_complaints": 0,
                "avg_resolution_time_days": 0.0, "resolution_percent": 0.0
            }

        # 2. Daily Complaint Trend (Raised vs Resolved)
        trend_query = f"""
            SELECT 
                COALESCE(r.day, s.day) as day,
                COALESCE(r.raised, 0) as raised,
                COALESCE(s.resolved, 0) as resolved
            FROM (
                SELECT created_at::date as day, COUNT(*) as raised
                FROM namma_mla_complaints
                {where_sql}
                GROUP BY day
            ) r FULL OUTER JOIN (
                SELECT resolved_at::date as day, COUNT(*) as resolved
                FROM namma_mla_complaints
                {where_sql} {'AND' if where_sql else 'WHERE'} status = 'Resolved'
                GROUP BY day
            ) s ON r.day = s.day
            ORDER BY day ASC
        """
        # Note: we need to concatenate filters for the subqueries
        # Let's adjust parameters for full outer join
        # For simplicity, let's run separate queries for raised and resolved trends
        raised_trend_query = f"""
            SELECT created_at::date as day, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY day ORDER BY day ASC
        """
        cursor.execute(raised_trend_query, params)
        raised_days = cursor.fetchall()
        
        resolved_trend_query = f"""
            SELECT resolved_at::date as day, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql} {'AND' if where_sql else 'WHERE'} status = 'Resolved' AND resolved_at IS NOT NULL
            GROUP BY day ORDER BY day ASC
        """
        cursor.execute(resolved_trend_query, params)
        resolved_days = cursor.fetchall()
        
        # Merge daily trends in Python
        day_map = {}
        for d, count in raised_days:
            if d:
                d_str = d.isoformat()
                day_map[d_str] = {"day": d_str, "raised": count, "resolved": 0}
        for d, count in resolved_days:
            if d:
                d_str = d.isoformat()
                if d_str in day_map:
                    day_map[d_str]["resolved"] = count
                else:
                    day_map[d_str] = {"day": d_str, "raised": 0, "resolved": count}
        
        trends = sorted(list(day_map.values()), key=lambda x: x["day"])

        # 3. Category Distribution (Donut)
        cat_query = f"""
            SELECT category, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY category
            ORDER BY count DESC
        """
        cursor.execute(cat_query, params)
        categories = [{"category": r[0] or "Other", "count": r[1]} for r in cursor.fetchall()]

        # 4. Priority Distribution
        pri_query = f"""
            SELECT priority, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY priority
            ORDER BY count DESC
        """
        cursor.execute(pri_query, params)
        priorities = [{"priority": r[0] or "Medium", "count": r[1]} for r in cursor.fetchall()]

        # 5. Status Distribution
        stat_query = f"""
            SELECT status, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY status
            ORDER BY count DESC
        """
        cursor.execute(stat_query, params)
        statuses = [{"status": r[0] or "Pending", "count": r[1]} for r in cursor.fetchall()]

        # 6. Assignee Workload
        ass_query = f"""
            SELECT COALESCE(assignee, 'Unassigned') as name, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY name
            ORDER BY count DESC
        """
        cursor.execute(ass_query, params)
        assignee_workload = [{"assignee": r[0], "count": r[1]} for r in cursor.fetchall()]

        # 7. Ward-wise Complaints (Top 10 Wards)
        ward_query = f"""
            SELECT COALESCE(ward_number, 'Unknown') as name, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY name
            ORDER BY count DESC
            LIMIT 10
        """
        cursor.execute(ward_query, params)
        wards = [{"ward_number": r[0], "count": r[1]} for r in cursor.fetchall()]

        # 8. Constituency Breakdown
        const_query = f"""
            SELECT constituency, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY constituency
            ORDER BY count DESC
        """
        cursor.execute(const_query, params)
        constituencies = [{"constituency": r[0] or "Ambattur", "count": r[1]} for r in cursor.fetchall()]

        # 9. Monthly Comparison (Created vs Resolved)
        # Aggregation by month
        mon_raised_query = f"""
            SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY month ORDER BY month ASC
        """
        cursor.execute(mon_raised_query, params)
        raised_months = cursor.fetchall()

        mon_resolved_query = f"""
            SELECT TO_CHAR(resolved_at, 'YYYY-MM') as month, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql} {'AND' if where_sql else 'WHERE'} status = 'Resolved' AND resolved_at IS NOT NULL
            GROUP BY month ORDER BY month ASC
        """
        cursor.execute(mon_resolved_query, params)
        resolved_months = cursor.fetchall()

        month_map = {}
        for m, count in raised_months:
            if m:
                month_map[m] = {"month": m, "created": count, "resolved": 0}
        for m, count in resolved_months:
            if m:
                if m in month_map:
                    month_map[m]["resolved"] = count
                else:
                    month_map[m] = {"month": m, "created": 0, "resolved": count}
        
        monthly_comparison = sorted(list(month_map.values()), key=lambda x: x["month"])

        # 10. Resolution Time by Category (Average days)
        res_time_query = f"""
            SELECT 
                category,
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_days
            FROM namma_mla_complaints
            {where_sql} {'AND' if where_sql else 'WHERE'} status = 'Resolved' AND resolved_at IS NOT NULL AND created_at IS NOT NULL
            GROUP BY category
            ORDER BY avg_days ASC
        """
        cursor.execute(res_time_query, params)
        resolution_times = [{"category": r[0] or "Other", "avg_days": round(r[1], 1)} for r in cursor.fetchall()]

        # 11. Heat Map (Ward vs Category Complaint Count)
        heat_query = f"""
            SELECT COALESCE(ward_number, 'Unknown') as ward_number, category, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY ward_number, category
            ORDER BY count DESC
            LIMIT 50
        """
        cursor.execute(heat_query, params)
        heatmap = [{"ward_number": r[0], "category": r[1] or "Other", "count": r[2]} for r in cursor.fetchall()]

        # 12. Sankey Flow (Category -> Assignee -> Status)
        # Create Nodes: unique list of names
        # Create Links: connections with source index and target index
        
        # Link 1: Category to Assignee
        cat_to_ass_query = f"""
            SELECT category, COALESCE(assignee, 'Unassigned') as assignee, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY category, assignee
        """
        cursor.execute(cat_to_ass_query, params)
        cat_ass_links = cursor.fetchall()

        # Link 2: Assignee to Status
        ass_to_stat_query = f"""
            SELECT COALESCE(assignee, 'Unassigned') as assignee, status, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY assignee, status
        """
        cursor.execute(ass_to_stat_query, params)
        ass_stat_links = cursor.fetchall()

        # Process nodes and links
        node_names = []
        node_indexes = {}

        def get_node_index(name):
            if name not in node_indexes:
                node_indexes[name] = len(node_names)
                node_names.append(name)
            return node_indexes[name]

        links = []
        for cat, ass, val in cat_ass_links:
            source = get_node_index(cat or "Other")
            target = get_node_index(ass)
            links.append({"source": source, "target": target, "value": val})

        for ass, stat, val in ass_stat_links:
            source = get_node_index(ass)
            target = get_node_index(stat or "Pending")
            links.append({"source": source, "target": target, "value": val})

        sankey = {
            "nodes": [{"name": n} for n in node_names],
            "links": links
        }

    return {
        "kpis": kpis,
        "complaint_trend": trends,
        "category_distribution": categories,
        "priority_distribution": priorities,
        "status_distribution": statuses,
        "assignee_workload": assignee_workload,
        "ward_wise_complaints": wards,
        "constituency_breakdown": constituencies,
        "monthly_comparison": monthly_comparison,
        "resolution_time": resolution_times,
        "heatmap": heatmap,
        "sankey_flow": sankey
    }

def get_complaints_list(filters: Dict[str, Any], page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """Retrieves paginated and filtered complaint details (useful for Drill Down)."""
    where_sql, params = build_filter_clause(filters)
    offset = (page - 1) * limit
    
    with db.get_db_cursor() as cursor:
        # Get count
        count_query = f"SELECT COUNT(*) FROM namma_mla_complaints {where_sql};"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get detailed rows
        select_query = f"""
            SELECT 
                id, complaint_id, title, description, category, priority, status,
                citizen_name, mobile, ward_number, constituency, city, state,
                resolution_note, resolved_at, created_at, assignee, imported_at
            FROM namma_mla_complaints
            {where_sql}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s;
        """
        query_params = params + [limit, offset]
        cursor.execute(select_query, query_params)
        rows = cursor.fetchall()
        
        complaints = []
        for r in rows:
            complaints.append({
                "id": r[0],
                "complaint_id": r[1],
                "title": r[2],
                "description": r[3],
                "category": r[4],
                "priority": r[5],
                "status": r[6],
                "citizen_name": r[7],
                "mobile": r[8],
                "ward_number": r[9],
                "constituency": r[10],
                "city": r[11],
                "state": r[12],
                "resolution_note": r[13],
                "resolved_at": r[14].isoformat() if r[14] else None,
                "created_at": r[15].isoformat() if r[15] else None,
                "assignee": r[16],
                "imported_at": r[17].isoformat() if r[17] else None
            })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "complaints": complaints
    }

def get_leaderboard_data(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generates the officer leaderboard ranked by resolved count and completion rate."""
    where_sql, params = build_filter_clause(filters)
    
    leaderboard = []
    with db.get_db_cursor() as cursor:
        query = f"""
            SELECT 
                COALESCE(assignee, 'Unassigned') as officer,
                COUNT(*) as total_assigned,
                COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved,
                COUNT(CASE WHEN status NOT IN ('Resolved', 'Rejected') THEN 1 END) as pending,
                AVG(CASE WHEN status = 'Resolved' AND resolved_at IS NOT NULL AND created_at IS NOT NULL 
                         THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/86400 END) as avg_resolution_time,
                CASE WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'Resolved' THEN 1 END)::float / COUNT(*)::float) * 100 ELSE 0 END as completion_percent
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY officer
            ORDER BY completion_percent DESC, resolved DESC
        """
        cursor.execute(query, params)
        rows = cursor.fetchall()
        for idx, r in enumerate(rows, start=1):
            leaderboard.append({
                "rank": idx,
                "officer": r[0],
                "total_assigned": r[1],
                "resolved": r[2],
                "pending": r[3],
                "avg_resolution_time_days": round(r[4], 1) if r[4] is not None else 0.0,
                "completion_percent": round(r[5], 1)
            })
            
    return leaderboard

def get_ward_performance(filters: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates ward specific metrics (most/least complaints, fastest/slowest resolution)."""
    where_sql, params = build_filter_clause(filters)
    
    with db.get_db_cursor() as cursor:
        # Most Complaints Ward
        cursor.execute(
            f"""
            SELECT COALESCE(ward_number, 'Unknown') as ward, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY ward ORDER BY count DESC LIMIT 1
            """,
            params
        )
        most_row = cursor.fetchone()
        most_complaints = {"ward": most_row[0], "count": most_row[1]} if most_row else {"ward": "N/A", "count": 0}

        # Least Complaints Ward
        cursor.execute(
            f"""
            SELECT COALESCE(ward_number, 'Unknown') as ward, COUNT(*) as count
            FROM namma_mla_complaints
            {where_sql}
            GROUP BY ward ORDER BY count ASC LIMIT 1
            """,
            params
        )
        least_row = cursor.fetchone()
        least_complaints = {"ward": least_row[0], "count": least_row[1]} if least_row else {"ward": "N/A", "count": 0}

        # Fastest Resolved Ward
        cursor.execute(
            f"""
            SELECT 
                COALESCE(ward_number, 'Unknown') as ward, 
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_days
            FROM namma_mla_complaints
            {where_sql} {'AND' if where_sql else 'WHERE'} status = 'Resolved' AND resolved_at IS NOT NULL AND created_at IS NOT NULL
            GROUP BY ward ORDER BY avg_days ASC LIMIT 1
            """,
            params
        )
        fast_row = cursor.fetchone()
        fastest_resolved = {"ward": fast_row[0], "avg_days": round(fast_row[1], 1)} if fast_row else {"ward": "N/A", "avg_days": 0.0}

        # Slowest Resolved Ward
        cursor.execute(
            f"""
            SELECT 
                COALESCE(ward_number, 'Unknown') as ward, 
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_days
            FROM namma_mla_complaints
            {where_sql} {'AND' if where_sql else 'WHERE'} status = 'Resolved' AND resolved_at IS NOT NULL AND created_at IS NOT NULL
            GROUP BY ward ORDER BY avg_days DESC LIMIT 1
            """,
            params
        )
        slow_row = cursor.fetchone()
        slowest_resolved = {"ward": slow_row[0], "avg_days": round(slow_row[1], 1)} if slow_row else {"ward": "N/A", "avg_days": 0.0}

    return {
        "most_complaints": most_complaints,
        "least_complaints": least_complaints,
        "fastest_resolved": fastest_resolved,
        "slowest_resolved": slowest_resolved
    }

def get_upload_history() -> List[Dict[str, Any]]:
    """Gets the history of daily Excel sheet imports."""
    history = []
    with db.get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT 
                u.upload_batch_id, u.filename, u.total_rows, u.imported_rows,
                u.duplicate_rows, u.invalid_rows, u.uploaded_at, a.email
            FROM namma_mla_uploads u
            LEFT JOIN admins a ON u.uploaded_by = a.id
            ORDER BY u.uploaded_at DESC;
            """
        )
        rows = cursor.fetchall()
        for r in rows:
            history.append({
                "upload_batch_id": str(r[0]),
                "filename": r[1],
                "total_rows": r[2],
                "imported_rows": r[3],
                "duplicate_rows": r[4],
                "invalid_rows": r[5],
                "uploaded_at": r[6].isoformat(),
                "uploaded_by_email": r[7] or "Unknown Admin"
            })
    return history

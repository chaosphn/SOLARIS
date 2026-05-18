// ─── Common ───────────────────────────────────────────────────────────────────

export interface MaintenanceResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
}

// ─── Plants ───────────────────────────────────────────────────────────────────

export interface PlantModel {
    id: string;
    name: string;
    location?: string;
    [key: string]: any;
}

export interface GetPlantByIdRequest {
    id: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface MaintenanceUserModel {
    id: string | number;
    username: string;
    name?: string;
    email?: string;
    role?: string;
    [key: string]: any;
}

// ─── Work Orders ──────────────────────────────────────────────────────────────

export type WorkOrderStatus = 'draft' | 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderType = 'corrective' | 'preventive' | 'inspection' | 'emergency';

export interface WorkOrderModel {
    id: number;
    wo_number: string;
    plant_id: string;
    title: string;
    description?: string;
    type?: WorkOrderType;
    priority?: WorkOrderPriority;
    status: WorkOrderStatus;
    assigned_to?: string;
    created_by: string;
    scheduled_date?: string;
    due_date?: string;
    completed_date?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface GetWorkOrderByIdRequest {
    id: number;
}

export interface GetWorkOrdersByPlantRequest {
    plant_id: string;
}

export interface GetWorkOrdersByStatusRequest {
    status: WorkOrderStatus;
}

export interface GetWorkOrdersByAssigneeRequest {
    assigned_to: string;
}

export interface CreateWorkOrderRequest {
    plant_id: string;
    title: string;
    created_by: string;
    description?: string;
    type?: WorkOrderType;
    priority?: WorkOrderPriority;
    status?: WorkOrderStatus;
    assigned_to?: string;
    scheduled_date?: string;
    due_date?: string;
    notes?: string;
}

export interface UpdateWorkOrderRequest {
    id: number;
    title?: string;
    description?: string;
    type?: WorkOrderType;
    priority?: WorkOrderPriority;
    assigned_to?: string;
    scheduled_date?: string;
    due_date?: string;
    notes?: string;
}

export interface UpdateWorkOrderStatusRequest {
    id: number;
    status: WorkOrderStatus;
}

export interface DeleteWorkOrderRequest {
    id: number;
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export interface ChecklistItemModel {
    id: number;
    work_order_id: number;
    label: string;
    is_checked: boolean;
    order?: number;
    created_at?: string;
    updated_at?: string;
}

export interface GetChecklistsByWorkOrderRequest {
    work_order_id: number;
}

export interface CreateChecklistRequest {
    work_order_id: number;
    label: string;
    order?: number;
}

export interface UpdateChecklistRequest {
    id: number;
    label?: string;
    order?: number;
}

export interface ToggleChecklistRequest {
    id: number;
}

export interface DeleteChecklistRequest {
    id: number;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface WoReportModel {
    id: number;
    work_order_id: number;
    work_date: string;
    submitted_by: string;
    summary?: string;
    findings?: string;
    actions_taken?: string;
    recommendations?: string;
    next_service_date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface GetReportByWorkOrderRequest {
    work_order_id: number;
}

export interface CreateWoReportRequest {
    work_order_id: number;
    submitted_by: string;
    work_date: string;
    summary?: string;
    findings?: string;
    actions_taken?: string;
    recommendations?: string;
    next_service_date?: string;
}

export interface UpdateWoReportRequest {
    id: number;
    work_date?: string;
    summary?: string;
    findings?: string;
    actions_taken?: string;
    recommendations?: string;
    next_service_date?: string;
}

export interface DeleteWoReportRequest {
    id: number;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export interface WoPhotoModel {
    id: number;
    work_order_id: number;
    file_path: string;
    caption?: string;
    photo_type?: string;
    created_at?: string;
}

export interface GetPhotosByWorkOrderRequest {
    work_order_id: number;
}

export interface UploadPhotoRequest {
    file: File;
    work_order_id: number;
    caption?: string;
    photo_type?: string;
}

export interface DeletePhotoRequest {
    id: number;
}

// ─── Signatures ───────────────────────────────────────────────────────────────

export interface WoSignatureModel {
    id: number;
    work_order_id: number;
    signed_by: string;
    signature_data?: string;
    signed_at?: string;
    created_at?: string;
}

export interface GetSignatureByWorkOrderRequest {
    work_order_id: number;
}

export interface CreateSignatureRequest {
    work_order_id: number;
    signed_by: string;
    signature_data?: string;
}

export interface DeleteSignatureRequest {
    id: number;
}

// ─── Maintenance Schedules ────────────────────────────────────────────────────

export interface MaintenanceScheduleModel {
    id: number;
    plant_id: string;
    title: string;
    description?: string;
    frequency?: string;
    cron?: string;
    next_due?: string;
    last_done?: string;
    assigned_to?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GetScheduleByIdRequest {
    id: number;
}

export interface GetSchedulesByPlantRequest {
    plant_id: string;
}

export interface CreateScheduleRequest {
    plant_id: string;
    title: string;
    description?: string;
    frequency?: string;
    cron?: string;
    next_due?: string;
    assigned_to?: string;
    is_active?: boolean;
}

export interface UpdateScheduleRequest {
    id: number;
    title?: string;
    description?: string;
    frequency?: string;
    cron?: string;
    next_due?: string;
    last_done?: string;
    assigned_to?: string;
    is_active?: boolean;
}

export interface DeleteScheduleRequest {
    id: number;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface MaintenanceLogModel {
    id: number;
    work_order_id: number;
    wo_number?: string;
    action: string;
    from_status?: string;
    to_status?: string;
    user?: string;
    created_at?: string;
}

export interface GetLogsByWorkOrderRequest {
    work_order_id: number;
}

export interface DeleteLogRequest {
    id: number;
}

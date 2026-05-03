<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentNotification;

class StudentNotificationController extends Controller
{
    // GET /student/notifications
    public function index(Request $request)
    {
        $notifications = StudentNotification::where('student_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'type', 'title', 'body', 'url', 'is_read', 'created_at']);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $notifications->where('is_read', false)->count(),
        ]);
    }

    // PATCH /student/notifications/read-all
    public function markAllRead(Request $request)
    {
        StudentNotification::where('student_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    // PATCH /student/notifications/{id}/read
    public function markRead(Request $request, $id)
    {
        StudentNotification::where('id', $id)
            ->where('student_id', $request->user()->id)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }
}
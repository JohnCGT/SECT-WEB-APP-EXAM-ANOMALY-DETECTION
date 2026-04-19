<?php

// backend/app/Http/Controllers/SupportTicketController.php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\Request;

/**
 * SupportTicketController
 *
 * Student / Instructor endpoints (protected, any authenticated role):
 *   POST  /api/support/tickets          → submit a new ticket
 *   GET   /api/support/tickets          → list own tickets
 *   GET   /api/support/tickets/{id}     → view own ticket
 *
 * Admin endpoints:
 *   GET   /api/admin/support            → list all tickets (filterable)
 *   GET   /api/admin/support/{id}       → view one ticket
 *   PATCH /api/admin/support/{id}       → update status + write response
 */
class SupportTicketController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════════
    // STUDENT / INSTRUCTOR  — submit and view own tickets
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/support/tickets
     * Any authenticated user (student or instructor) can open a ticket.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'  => 'required|string|max:255',
            'message'  => 'required|string|max:5000',
            'category' => 'required|in:technical,exam_issue,account,grading,other',
            'priority' => 'required|in:low,medium,high',
            'exam_id'  => 'nullable|integer|exists:exams,id',
        ]);

        $ticket = SupportTicket::create([
            'user_id'  => $request->user()->id,
            'subject'  => $validated['subject'],
            'message'  => $validated['message'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'exam_id'  => $validated['exam_id'] ?? null,
            'status'   => 'open',
        ]);

        return response()->json([
            'message' => 'Support ticket submitted. Our team will respond shortly.',
            'ticket'  => $this->formatTicket($ticket->load('user')),
        ], 201);
    }

    /**
     * GET /api/support/tickets
     * Returns tickets belonging to the authenticated user only.
     */
    public function myTickets(Request $request)
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $this->formatTicket($t));

        return response()->json(['data' => $tickets]);
    }

    /**
     * GET /api/support/tickets/{id}
     * A user can only view their own ticket.
     */
    public function myShow(Request $request, int $id)
    {
        $ticket = SupportTicket::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json(['ticket' => $this->formatTicket($ticket->load('user'))]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN — manage all tickets
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/support
     * List all tickets. Supports filtering by status, priority, category, role.
     *
     * Response shape:
     * {
     *   "data": [{ id, subject, message, category, priority, status,
     *              admin_response, user: {id, name, email, role},
     *              created_at, updated_at }]
     * }
     */
    public function adminIndex(Request $request)
    {
        $this->authorizeAdmin();

        $query = SupportTicket::with(['user:id,name,email,role'])
            ->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")   // high first
            ->orderByRaw("FIELD(status, 'open', 'in_progress', 'resolved', 'closed')")
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }
        // Filter by reporter role (join through users table)
        if ($request->filled('role')) {
            $query->whereHas('user', fn($q) => $q->where('role', $request->input('role')));
        }

        $tickets = $query->get()->map(fn($t) => $this->formatTicket($t));

        return response()->json(['data' => $tickets]);
    }

    /**
     * GET /api/admin/support/{id}
     */
    public function adminShow(int $id)
    {
        $this->authorizeAdmin();

        $ticket = SupportTicket::with(['user:id,name,email,role', 'respondedBy:id,name'])
            ->findOrFail($id);

        return response()->json(['ticket' => $this->formatTicket($ticket)]);
    }

    /**
     * PATCH /api/admin/support/{id}
     * Admin updates the ticket's status and/or writes a response.
     *
     * Body: { status, admin_response }
     * Response: { message, ticket }
     */
    public function adminUpdate(Request $request, int $id)
    {
        $this->authorizeAdmin();

        $ticket = SupportTicket::with('user:id,name,email,role')->findOrFail($id);

        $validated = $request->validate([
            'status'         => 'required|in:open,in_progress,resolved,closed',
            'admin_response' => 'nullable|string|max:5000',
        ]);

        $ticket->status         = $validated['status'];
        $ticket->admin_response = $validated['admin_response'] ?? $ticket->admin_response;

        if ($request->filled('admin_response') && !$ticket->responded_at) {
            $ticket->responded_by = auth()->id();
            $ticket->responded_at = now();
        }

        $ticket->save();

        return response()->json([
            'message' => 'Ticket updated.',
            'ticket'  => $this->formatTicket($ticket),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Forbidden: Admins only.');
        }
    }

    private function formatTicket(SupportTicket $t): array
    {
        return [
            'id'             => $t->id,
            'subject'        => $t->subject,
            'message'        => $t->message,
            'category'       => $t->category,
            'priority'       => $t->priority,
            'status'         => $t->status,
            'admin_response' => $t->admin_response,
            'exam_id'        => $t->exam_id,
            'user'           => $t->user ? [
                'id'    => $t->user->id,
                'name'  => $t->user->name,
                'email' => $t->user->email,
                'role'  => $t->user->role,
            ] : null,
            'responded_at'   => $t->responded_at?->toISOString(),
            'created_at'     => $t->created_at?->toISOString(),
            'updated_at'     => $t->updated_at?->toISOString(),
        ];
    }
}
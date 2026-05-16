<?php

namespace App\Http\Controllers\Instructor;
use App\Http\Controllers\Controller;

use App\Models\Course;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class CourseStudentController extends Controller
{
    /**
     * List all students enrolled in a specific course.
     * Only accessible by the course's instructor.
     */
    public function index(Request $request, $courseId)
    {
        $course = Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $students = $course->students()
            ->select('users.id', 'users.name', 'users.email', 'course_students.enrolled_at')
            ->orderBy('users.name')
            ->get();

        return response()->json(['students' => $students]);
    }

    /**
     * Enroll an existing student OR create a new student account and enroll them.
     * After enrollment, a 'new_subject' notification is sent to the student so
     * it appears in their dashboard notification bell.
     */
    public function store(Request $request, $courseId)
    {
        $course = Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'mode'      => ['required', Rule::in(['existing', 'new'])],
            // For enrolling an existing student by email
            'email'     => ['required_if:mode,existing', 'nullable', 'email'],
            // For creating a brand-new student account
            'name'      => ['required_if:mode,new', 'nullable', 'string', 'max:255'],
            'new_email' => ['required_if:mode,new', 'nullable', 'email', 'unique:users,email'],
            'password'  => ['required_if:mode,new', 'nullable', 'string', 'min:8'],
        ]);

        $instructor = $request->user();

        if ($data['mode'] === 'existing') {
            // ── Enroll an existing student ──────────────────────────────────
            $student = User::where('email', $data['email'])
                ->where('role', 'student')
                ->first();

            if (!$student) {
                return response()->json([
                    'message' => 'No student account found with that email address.'
                ], 404);
            }

            if ($course->students()->where('student_id', $student->id)->exists()) {
                return response()->json([
                    'message' => 'This student is already enrolled in the course.'
                ], 409);
            }

            $course->students()->attach($student->id, ['enrolled_at' => now()]);

            // Notify the student that they have been enrolled in a new subject
            StudentNotification::create([
                'student_id' => $student->id,
                'type'       => 'new_subject',
                'title'      => "Enrolled in {$course->name}",
                'body'       => "{$instructor->name} added you to this subject.",
                'url'        => null,
                'is_read'    => false,
            ]);

        } else {
            // ── Create a brand-new student account and enroll them ──────────
            $student = User::create([
                'name'     => $data['name'],
                'email'    => $data['new_email'],
                'password' => Hash::make($data['password']),
                'role'     => 'student',
            ]);

            $course->students()->attach($student->id, ['enrolled_at' => now()]);

            // Notify the newly created student that they have been enrolled
            StudentNotification::create([
                'student_id' => $student->id,
                'type'       => 'new_subject',
                'title'      => "Enrolled in {$course->name}",
                'body'       => "{$instructor->name} added you to this subject.",
                'url'        => null,
                'is_read'    => false,
            ]);
        }

        return response()->json([
            'message' => 'Student enrolled successfully.',
            'student' => [
                'id'          => $student->id,
                'name'        => $student->name,
                'email'       => $student->email,
                'enrolled_at' => now()->toISOString(),
            ]
        ], 201);
    }

    /**
     * Remove (unenroll) a student from the course.
     * Does NOT delete the user account — only removes the enrollment.
     */
    public function destroy(Request $request, $courseId, $studentId)
    {
        $course = Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $detached = $course->students()->detach($studentId);

        if (!$detached) {
            return response()->json(['message' => 'Student not found in this course.'], 404);
        }

        return response()->json(['message' => 'Student removed from course successfully.']);
    }

    /**
     * Search all student-role accounts (used for the "add existing student" flow).
     */
    public function search(Request $request)
    {
        $query = $request->query('q', '');

        $students = User::where('role', 'student')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'email')
            ->limit(20)
            ->get();

        return response()->json(['students' => $students]);
    }
}
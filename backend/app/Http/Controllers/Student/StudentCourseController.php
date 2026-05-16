<?php

namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

class StudentCourseController extends Controller
{
    /**
     * Return all courses the authenticated student is enrolled in.
     * 
     * This method retrieves all courses that the student has enrolled in,
     * along with instructor information and associated exams.
     * Only accessible by users with the 'student' role.
     * 
     * @param Request $request Contains the authenticated user
     * @return JSON response with list of enrolled courses
     */
    public function index(Request $request)
    {
        // Get the currently authenticated user
        $student = $request->user();

        // Verify that the user has the 'student' role
        // This prevents instructors or admins from accessing student endpoints
        if ($student->role !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403); // 403 = Forbidden
        }

        // Get all courses the student is enrolled in
        // enrolledCourses() is a relationship method defined in the User model
        $courses = $student->enrolledCourses()
            ->with([
                // Eager load the instructor information (only specific fields)
                'instructor:id,name,email',
                
                // Eager load exams with filtering
                'exams' => function ($q) {
                    // Only include exams with these specific statuses
                    $q->whereIn('status', ['published', 'scheduled', 'active', 'completed'])
                      // Select only necessary exam fields to reduce data transfer
                      ->select(
                          'id', 'course_id', 'title', 'type',
                          'start_time', 'end_time',
                          'duration_minutes', 'total_points', 'status'
                      )
                      // Order exams by start time (earliest first)
                      ->orderBy('start_time');
                },
            ])
            ->get() // Execute the query and get results
            ->map(function ($course) {
                // Transform each course to include specific structure
                return [
                    'id'          => $course->id,
                    'code'        => $course->code, // Course code (e.g., CS101)
                    'name'        => $course->name, // Course name
                    'description' => $course->description,
                    'semester'    => $course->semester, // e.g., Fall 2024
                    'credits'     => $course->credits, // Credit hours
                    'instructor'  => $course->instructor, // Instructor details
                    'exams'       => $course->exams, // All exams for this course
                    'exams_count' => $course->exams->count(), // Count of exams
                    'enrolled_at' => $course->pivot->enrolled_at, // Enrollment date from pivot table
                ];
            });

        // Return the list of courses
        return response()->json(['courses' => $courses]);
    }

    /**
     * Return a single course the student is enrolled in.
     * 
     * This method retrieves detailed information about a specific course
     * that the student is enrolled in, including instructor and exam details.
     * Only accessible by users with the 'student' role.
     * 
     * @param Request $request Contains the authenticated user
     * @param int $courseId The ID of the course to retrieve
     * @return JSON response with course details
     */
    public function show(Request $request, $courseId)
    {
        // Get the currently authenticated user
        $student = $request->user();

        // Verify that the user has the 'student' role
        if ($student->role !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403); // 403 = Forbidden
        }

        // Get the specific course the student is enrolled in
        $course = $student->enrolledCourses()
            ->with([
                // Eager load instructor information
                'instructor:id,name,email',
                
                // Eager load exams with filtering
                'exams' => function ($q) {
                    // Only include exams that are scheduled, active, or completed
                    $q->whereIn('status', ['published', 'scheduled', 'active', 'completed'])
                      // Order by start time (earliest first)
                      ->orderBy('start_time');
                },
            ])
            // Filter for the specific course ID
            // 'courses.id' specifies the table to avoid ambiguity in joins
            ->where('courses.id', $courseId)
            ->first(); // Get the first (and only) matching course

        // Check if the course was found
        if (!$course) {
            // Return 404 if course doesn't exist or student is not enrolled
            return response()->json(['message' => 'Course not found or not enrolled.'], 404);
        }

        // Return the course details
        return response()->json(['course' => $course]);
    }
}
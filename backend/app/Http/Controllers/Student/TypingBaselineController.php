<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\KeystrokeBaseline;
use App\Jobs\TrainHMMBaseline;

class TypingBaselineController extends Controller
{
    // GET /student/typing-baseline/status
    // Returns whether the student already has a saved baseline
    public function status(Request $request)
    {
        $baseline = DB::table('keystroke_baselines')
            ->where('student_id', $request->user()->id)
            ->first();

        return response()->json([
            'has_baseline' => !!$baseline,
            'recorded_at'  => $baseline ? $baseline->recorded_at : null,
        ]);
    }

    // POST /student/typing-baseline
    // Saves the baseline and triggers HMM training in Flask
    public function store(Request $request)
    {
        $request->validate([
            'flight_times_ms'   => 'required|array|min:50',
            'flight_times_ms.*' => 'numeric|min:0',
        ]);

        $student = $request->user();

        // Save or replace the baseline in the database
        KeystrokeBaseline::updateOrCreate(
            ['student_id' => $student->id],
            [
                'flight_times_ms' => $request->flight_times_ms,
                'recorded_at'     => now(),
            ]
        );

        // Dispatch background job to train HMM in Flask
        TrainHMMBaseline::dispatch(
            $student->id,
            $request->flight_times_ms
        );

        return response()->json(['message' => 'Baseline saved successfully.']);
    }
}
<?php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TrainHMMBaseline implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $studentId;
    public array $flightTimesMs;
    public int   $tries   = 2;
    public int   $timeout = 60;

    public function __construct(int $studentId, array $flightTimesMs)
    {
        $this->studentId    = $studentId;
        $this->flightTimesMs = $flightTimesMs;
    }

    public function handle(): void
    {
        $payload = json_encode([
            'student_id'      => (string) $this->studentId,
            'flight_times_ms' => $this->flightTimesMs,
        ]);

        $ch = curl_init('http://127.0.0.1:5001/train-baseline');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST,           true);
        curl_setopt($ch, CURLOPT_POSTFIELDS,     $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER,     ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT,        30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        Log::info('[TrainHMMBaseline] Flask response', [
            'student_id' => $this->studentId,
            'http_code'  => $httpCode,
            'response'   => $response,
        ]);

        if ($httpCode !== 200) {
            throw new \Exception("Flask returned HTTP {\$httpCode}: {\$response}");
        }
    }
}

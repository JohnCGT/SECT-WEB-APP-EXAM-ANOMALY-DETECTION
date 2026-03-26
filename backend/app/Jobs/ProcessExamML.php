<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessExamML implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int    $submissionId;
    public string $examStart;
    public string $examEnd;

    // Retry once if it fails, timeout after 130 seconds
    public int $tries   = 2;
    public int $timeout = 130;

    public function __construct(int $submissionId, string $examStart, string $examEnd)
    {
        $this->submissionId = $submissionId;
        $this->examStart    = $examStart;
        $this->examEnd      = $examEnd;
    }

    public function handle(): void
    {
        $payload = json_encode([
            'session_id' => (string) $this->submissionId,
            'exam_start' => $this->examStart,
            'exam_end'   => $this->examEnd,
        ]);

        $ch = curl_init('http://127.0.0.1:5001/process-exam');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST,           true);
        curl_setopt($ch, CURLOPT_POSTFIELDS,     $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER,     ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT,        120);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        Log::info('[ProcessExamML] Flask response', [
            'submission_id' => $this->submissionId,
            'http_code'     => $httpCode,
            'response'      => $response,
        ]);

        if ($httpCode !== 200) {
            throw new \Exception("Flask returned HTTP {$httpCode}: {$response}");
        }
    }
}
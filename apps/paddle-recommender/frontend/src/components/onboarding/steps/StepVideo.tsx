import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, CheckCircle, VideoIcon, Trash2, RotateCcw } from 'lucide-react';

export default function StepVideo() {
  const { video, setVideo } = useOnboardingStore();
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [consent, setConsent] = React.useState({
    store_video: false,
    share_metrics: false
  });
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Recording timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 12) {
            stopRecording();
            return 12;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const recorder = new MediaRecorder(mediaStream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        processVideoBlob(blob);
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const processVideoFile = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = video.duration * 1000; // Convert to ms
      
      // Basic quality checks
      const quality = {
        lighting: duration > 5000 ? 'ok' as const : 'poor' as const,
        stability: 'ok' as const, // Would need actual analysis
        subject_size: video.videoWidth > 640 ? 'ok' as const : 'poor' as const
      };

      const videoMeta = {
        upload_id: `upload_${Date.now()}`,
        duration_ms: Math.min(duration, 12000), // Cap at 12s
        fps: 30, // Estimated
        width: video.videoWidth,
        height: video.videoHeight,
        quality,
        consent: { ...consent }
      };

      setVideo(videoMeta);
      window.URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  };

  const processVideoBlob = (blob: Blob) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = recordingTime * 1000; // Use actual recording time
      
      const quality = {
        lighting: 'ok' as const, // Basic assumption for live recording
        stability: 'ok' as const,
        subject_size: 'ok' as const
      };

      const videoMeta = {
        upload_id: `record_${Date.now()}`,
        duration_ms: duration,
        fps: 30,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        quality,
        consent: { ...consent }
      };

      setVideo(videoMeta);
      window.URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(blob);
  };

  const deleteVideo = () => {
    setVideo(undefined);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const retakeVideo = () => {
    deleteVideo();
    startRecording();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Optional Video / Data Capture</CardTitle>
        <CardDescription>
          Record or upload a short video (8-12s) for deeper personalization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!video ? (
          <>
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="default" 
                onClick={startRecording}
                disabled={isRecording}
                className="h-20 flex-col space-y-2"
                aria-label="Record video using camera"
              >
                <VideoIcon className="h-6 w-6" />
                <span>Record</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="h-20 flex-col space-y-2"
                aria-label="Upload video file"
              >
                <Upload className="h-6 w-6" />
                <span>Upload</span>
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => {/* Skip - no action needed */}}
                className="h-20 flex-col space-y-2"
                aria-label="Skip video capture"
              >
                <span className="text-2xl">⏭️</span>
                <span>Skip</span>
              </Button>
            </div>

            {/* Recording Interface */}
            {isRecording && (
              <div className="space-y-4">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  className="w-full max-w-md mx-auto rounded-lg border"
                  aria-label="Live camera preview"
                />
                <div className="text-center space-y-2">
                  <div className="text-2xl font-mono text-red-500">
                    {recordingTime}s / 12s
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={stopRecording}
                    aria-label="Stop recording"
                  >
                    Stop Recording
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Video file input"
            />

            {/* Quality Requirements */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">For Best Results:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>8-12 seconds</strong> of playing footage</li>
                <li>• <strong>Good lighting</strong> - avoid shadows/backlighting</li>
                <li>• <strong>Stable camera</strong> - minimal shaking</li>
                <li>• <strong>Full body visible</strong> - show your swing form</li>
                <li>• Side angle preferred for swing analysis</li>
              </ul>
            </div>
          </>
        ) : (
          /* Video Captured/Uploaded */
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-medium">Video Ready!</h3>
            <div className="text-muted-foreground space-y-1">
              <p>Duration: {Math.round(video.duration_ms / 1000)}s</p>
              <p>Quality: {video.quality.lighting === 'ok' && video.quality.stability === 'ok' && video.quality.subject_size === 'ok' ? 'Good' : 'Needs improvement'}</p>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                onClick={retakeVideo}
                aria-label="Retake video"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteVideo}
                aria-label="Delete video"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Consent Options - Default OFF */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Privacy & Consent</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="store-consent">Store video for future analysis</Label>
              <p className="text-sm text-muted-foreground">
                Keep raw video to improve recommendations over time
              </p>
            </div>
            <Switch
              id="store-consent"
              checked={consent.store_video}
              onCheckedChange={(checked) => setConsent(prev => ({ ...prev, store_video: checked }))}
              aria-label="Toggle video storage consent"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-consent">Share anonymized metrics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve our system (no personal data shared)
              </p>
            </div>
            <Switch
              id="share-consent"
              checked={consent.share_metrics}
              onCheckedChange={(checked) => setConsent(prev => ({ ...prev, share_metrics: checked }))}
              aria-label="Toggle metrics sharing consent"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Note:</strong> We only store VideoMeta (duration, quality scores) unless you opt-in above. 
            Raw video is processed locally and discarded by default.
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>This step is optional.</strong> We can make excellent recommendations based on your profile answers alone!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

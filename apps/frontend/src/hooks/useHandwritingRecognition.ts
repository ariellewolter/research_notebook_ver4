import { useState, useEffect, useCallback } from 'react';

interface RecognitionResult {
  transcript: string;
  confidence: number;
  alternatives?: string[];
}

interface UseHandwritingRecognitionOptions {
  language?: string;
  maxAlternatives?: number;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseHandwritingRecognitionReturn {
  isSupported: boolean;
  isRecognizing: boolean;
  error: string | null;
  recognize: (strokes: any[]) => Promise<RecognitionResult | null>;
  cancel: () => void;
  reset: () => void;
}

export const useHandwritingRecognition = (
  options: UseHandwritingRecognitionOptions = {}
): UseHandwritingRecognitionReturn => {
  const {
    language = 'en-US',
    maxAlternatives = 3,
    continuous = false,
    interimResults = false
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognitionAPI, setRecognitionAPI] = useState<any>(null);

  useEffect(() => {
    // Check for handwriting recognition support
    const checkSupport = () => {
      // Check for Web Handwriting API (Chrome/Edge)
      if ('HandwritingRecognition' in window) {
        setIsSupported(true);
        setRecognitionAPI((window as any).HandwritingRecognition);
        return;
      }

      // Check for Webkit Handwriting API (Safari)
      if ('webkitHandwritingRecognition' in window) {
        setIsSupported(true);
        setRecognitionAPI((window as any).webkitHandwritingRecognition);
        return;
      }

      // Check for experimental Handwriting API
      if ('experimentalHandwritingRecognition' in window) {
        setIsSupported(true);
        setRecognitionAPI((window as any).experimentalHandwritingRecognition);
        return;
      }

      setIsSupported(false);
      setError('Handwriting recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    };

    checkSupport();
  }, []);

  const recognize = useCallback(async (strokes: any[]): Promise<RecognitionResult | null> => {
    if (!isSupported || !recognitionAPI) {
      setError('Handwriting recognition is not supported');
      return null;
    }

    if (strokes.length === 0) {
      setError('No handwriting strokes to recognize');
      return null;
    }

    setIsRecognizing(true);
    setError(null);

    return new Promise((resolve, reject) => {
      try {
        const recognition = new recognitionAPI();
        
        // Convert strokes to recognition format
        const ink = strokes.map(stroke => ({
          stroke: stroke.points.map((point: any) => ({
            x: point.x,
            y: point.y,
            t: point.timestamp || Date.now()
          }))
        }));

        // Configure recognition
        recognition.ink = ink;
        recognition.language = language;
        recognition.maxAlternatives = maxAlternatives;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        // Handle recognition results
        recognition.onresult = (event: any) => {
          const results = event.results;
          if (results && results.length > 0) {
            const result = results[0];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 0;
            const alternatives = result.slice(1).map((alt: any) => alt.transcript);

            const recognitionResult: RecognitionResult = {
              transcript,
              confidence,
              alternatives
            };

            resolve(recognitionResult);
          } else {
            reject(new Error('No recognition results'));
          }
        };

        recognition.onerror = (event: any) => {
          const errorMessage = `Recognition failed: ${event.error}`;
          setError(errorMessage);
          reject(new Error(errorMessage));
        };

        recognition.onend = () => {
          setIsRecognizing(false);
        };

        // Start recognition
        recognition.start();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown recognition error';
        setError(errorMessage);
        setIsRecognizing(false);
        reject(new Error(errorMessage));
      }
    });
  }, [isSupported, recognitionAPI, language, maxAlternatives, continuous, interimResults]);

  const cancel = useCallback(() => {
    setIsRecognizing(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsRecognizing(false);
    setError(null);
  }, []);

  return {
    isSupported,
    isRecognizing,
    error,
    recognize,
    cancel,
    reset
  };
}; 
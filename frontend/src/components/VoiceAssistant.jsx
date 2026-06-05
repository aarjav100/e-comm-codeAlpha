import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, X } from 'lucide-react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setProducts, setSearchQuery, setLoading, setError } from '../store/productSlice';

const VoiceAssistant = ({ onSearchComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const dispatch = useDispatch();

  let recognition = null;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setStatusMessage('Listening to product requirements...');
    };

    recognition.onresult = async (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setStatusMessage('Parsing requirements using Gemini AI...');
      setIsListening(false);
      
      // Perform AI Natural Language Search with speech to text
      try {
        dispatch(setLoading(true));
        const res = await axios.post('/api/products/search/ai', { query: speechToText });
        dispatch(setProducts(res.data.products));
        dispatch(setSearchQuery(speechToText));
        if (onSearchComplete) onSearchComplete(res.data.products, speechToText);
        setStatusMessage('AI matching catalog items successfully displayed!');
        setTimeout(() => setTranscript(''), 3000);
      } catch (err) {
        dispatch(setError(err.response?.data?.error || 'AI speech matching failed.'));
        setStatusMessage('Error parsing voice query.');
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
      setStatusMessage('Voice recognition encountered an error.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!supported) {
    return (
      <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
        <MicOff size={11} /> Voice Shopping not supported in this browser
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={startListening}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-all ${
            isListening 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-gold-500 hover:bg-gold-600 text-slate-900 dark:text-zinc-900'
          }`}
          title="Voice Shopping Assistant"
        >
          {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
        
        {transcript && (
          <div className="glass px-3 py-1.5 rounded-full text-xs max-w-[240px] truncate shadow-sm flex items-center gap-2">
            <Sparkles size={12} className="text-gold-600 animate-spin" />
            <span className="font-semibold text-slate-700 dark:text-zinc-350">"{transcript}"</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 top-12 left-0 w-64 glass p-3 rounded-xl shadow-xl flex flex-col gap-2 border border-gold-500/20"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gold-600 tracking-wider uppercase flex items-center gap-1">
                <Sparkles size={11} className="animate-pulse" /> Voice Shopping
              </span>
              <button onClick={() => setIsListening(false)} className="text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            </div>
            <p className="text-xs font-semibold animate-pulse text-slate-700 dark:text-zinc-350">{statusMessage}</p>
            <div className="flex items-center gap-1.5 justify-center py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-[10px] text-slate-500">Speaking...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceAssistant;

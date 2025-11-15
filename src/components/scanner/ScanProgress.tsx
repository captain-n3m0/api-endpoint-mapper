'use client';

import { useScannerStore } from '@/store/scanner-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Globe,
  Search,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ScanProgress() {
  const { currentScan } = useScannerStore();
  const { progress, isScanning, error } = currentScan;

  if (!isScanning && !progress && !error) {
    return null;
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'initializing': return <Activity className="w-4 h-4" />;
      case 'crawling': return <Search className="w-4 h-4" />;
      case 'analyzing': return <Zap className="w-4 h-4" />;
      case 'processing': return <Activity className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'completed': return 'success';
      case 'error': return 'destructive';
      case 'crawling':
      case 'analyzing':
      case 'processing': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="progress-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="text-white w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Scan Progress
              {progress && (
                <Badge variant={getStageColor(progress.stage) as any} className="ml-auto">
                  {getStageIcon(progress.stage)}
                  {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Scan Error</span>
                </div>
                <p className="text-red-600 mt-1 text-sm">{error}</p>
              </motion.div>
            )}

            {progress && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>

                <motion.div
                  key={progress.message}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  {isScanning && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Activity className="w-3 h-3" />
                    </motion.div>
                  )}
                  <span>{progress.message}</span>
                </motion.div>

                {progress.currentUrl && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 p-2 rounded border-l-2 border-blue-300 dark:border-blue-500">
                    <span className="font-medium">Current: </span>
                    <span className="break-all">{progress.currentUrl}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-center">
                  <motion.div
                    key={`pages-${progress.pagesScanned}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="bg-blue-50 p-3 rounded-lg border"
                  >
                    <div className="text-2xl font-bold text-blue-600">
                      {progress.pagesScanned}
                    </div>
                    <div className="text-xs text-blue-500 font-medium">Pages Scanned</div>
                  </motion.div>

                  <motion.div
                    key={`endpoints-${progress.endpointsFound}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="bg-green-50 p-3 rounded-lg border"
                  >
                    <div className="text-2xl font-bold text-green-600">
                      {progress.endpointsFound}
                    </div>
                    <div className="text-xs text-green-500 font-medium">Endpoints Found</div>
                  </motion.div>
                </div>

                {isScanning && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>This may take a few minutes depending on the site size</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

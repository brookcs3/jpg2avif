import React, { useState, useMemo, memo } from 'react';
import { siteConfig } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Optimized version that only runs in development mode
const DebugInfo = memo(() => {
  // Only show debug in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // If not in development, render nothing
  if (!isDevelopment) {
    return null;
  }

  return <DebugContent />;
});

// Separate the content to prevent unnecessary rendering
const DebugContent = () => {
  const [showDebug, setShowDebug] = useState(false);
  
  const debugData = useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const forceSite = urlParams.get('site')?.toLowerCase();
    
    // Determine site mode based on URL and hostname
    let siteMode = 'AVIFlip';
    let modeReason = 'Default fallback';
    
    if (forceSite === 'jpgflip') {
      siteMode = 'JPGFlip';
      modeReason = 'URL parameter override';
    } else if (forceSite === 'aviflip') {
      siteMode = 'AVIFlip';
      modeReason = 'URL parameter override'; 
    } else if (hostname === 'jpgflip.com' || hostname === 'www.jpgflip.com') {
      siteMode = 'JPGFlip';
      modeReason = 'Hostname match';
    } else if (hostname === 'aviflip.com' || hostname === 'www.aviflip.com') {
      siteMode = 'AVIFlip';
      modeReason = 'Hostname match';
    }
    
    return {
      siteMode,
      modeReason,
      hostname,
      protocol: window.location.protocol,
      fullUrl: window.location.href,
      forceSite,
    };
  }, []);
  
  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebug(true)}
          className="opacity-30 hover:opacity-100"
        >
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[90vw]">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Debug Info</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(false)}
              className="h-7 w-7 p-0"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1.5 pt-0">
          <div className="flex items-center gap-2">
            <strong>Mode:</strong> 
            <Badge variant={debugData.siteMode === 'JPGFlip' ? 'outline' : 'default'} className="text-[10px] h-4">
              {debugData.siteMode}
            </Badge>
            <span className="text-[10px] text-muted-foreground">({debugData.modeReason})</span>
          </div>
          
          <div>
            <strong>Site:</strong> {siteConfig.siteName}
          </div>
          <div>
            <strong>Default:</strong> {siteConfig.defaultConversionMode}
          </div>
          <div>
            <strong>Host:</strong> {debugData.hostname}
          </div>
          <div>
            <strong>URL param:</strong> {debugData.forceSite || 'None'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

DebugInfo.displayName = 'DebugInfo';
export default DebugInfo;
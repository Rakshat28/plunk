import Image from 'next/image';

export interface LoaderProps {
  message?: string;
  showLogo?: boolean;
}

/**
 * Full-screen loader component with animated logo and spinner
 */
export function Loader({message = 'Loading...', showLogo = true}: LoaderProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center animate-in fade-in duration-500">
        {showLogo && (
          <div className="mb-8 animate-in zoom-in-95 duration-700">
            <div className="relative w-20 h-20 mx-auto p-4 bg-white rounded-2xl shadow-sm border border-neutral-200/50">
              <Image src="/assets/logo.png" alt="Plunk" width={48} height={48} className="rounded-lg" priority />
            </div>
          </div>
        )}

        {/* Animated spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          {/* Outer glow effect */}
          <div className="absolute inset-0 rounded-full bg-neutral-900/10 blur-xl animate-pulse" />

          {/* Base circle */}
          <div className="absolute inset-0 rounded-full border-[3px] border-neutral-100" />

          {/* Primary animated ring */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-neutral-900 border-r-neutral-700 animate-spin"
            style={{animationDuration: '0.8s'}}
          />

          {/* Secondary animated ring (counter-rotating) */}
          <div
            className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-neutral-800 border-l-neutral-600 animate-spin"
            style={{animationDuration: '1.2s', animationDirection: 'reverse'}}
          />

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full animate-pulse shadow-lg" />
          </div>
        </div>

        {/* Loading message */}
        {message && <p className="text-sm font-medium text-neutral-700 animate-in fade-in duration-1000">{message}</p>}
      </div>
    </div>
  );
}

import {motion} from 'framer-motion';
import React, {useState} from 'react';

interface PricingData {
  name: string;
  calculatePrice: (emails: number) => number;
  color?: string;
}

interface PricingCalculatorProps {
  competitors: PricingData[];
  defaultVolume?: number;
}

const volumeOptions = [
  {label: '10K emails/month', value: 10000},
  {label: '100K emails/month', value: 100000},
  {label: '500K emails/month', value: 500000},
  {label: '1M emails/month', value: 1000000},
];

/**
 * Interactive pricing calculator comparing Plunk with competitors
 */
export function PricingCalculator({competitors, defaultVolume = 100000}: PricingCalculatorProps) {
  const [volume, setVolume] = useState(defaultVolume);

  const plunkPrice = volume * 0.001;

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
      className={'overflow-hidden rounded-xl border border-neutral-200 bg-white'}
    >
      {/* Header */}
      <div className={'border-b border-neutral-200 bg-neutral-50 p-8'}>
        <h3 className={'text-2xl font-bold text-neutral-900'}>Pricing Calculator</h3>
        <p className={'mt-2 text-sm text-neutral-600'}>Compare costs across platforms at different email volumes</p>
      </div>

      {/* Volume Selector */}
      <div className={'p-8'}>
        <label className={'block text-sm font-semibold text-neutral-900'}>Monthly Email Volume</label>
        <div className={'mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'}>
          {volumeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setVolume(option.value)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                volume === option.value
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className={'space-y-4 p-8 pt-0'}>
        {/* Plunk */}
        <div className={'rounded-lg border border-neutral-900 bg-neutral-50 p-6'}>
          <div className={'flex items-center justify-between'}>
            <div>
              <span className={'text-lg font-bold text-neutral-900'}>Plunk</span>
              <span className={'ml-3 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white'}>
                Cheapest
              </span>
            </div>
            <div className={'text-right'}>
              <div className={'text-3xl font-bold text-neutral-900'}>${plunkPrice.toFixed(2)}</div>
              <div className={'text-sm text-neutral-600'}>per month</div>
            </div>
          </div>
        </div>

        {/* Competitors */}
        {competitors.map((competitor, index) => {
          const price = competitor.calculatePrice(volume);
          const savings = ((price - plunkPrice) / price) * 100;

          return (
            <div key={competitor.name} className={'rounded-lg border border-neutral-200 bg-white p-6'}>
              <div className={'flex items-center justify-between'}>
                <div>
                  <span className={'text-lg font-semibold text-neutral-900'}>{competitor.name}</span>
                </div>
                <div className={'text-right'}>
                  <div className={'text-3xl font-bold text-neutral-900'}>${price.toFixed(2)}</div>
                  <div className={'text-sm text-neutral-600'}>per month</div>
                </div>
              </div>
              {savings > 0 && (
                <div className={'mt-3 text-sm text-neutral-600'}>
                  Save <span className={'font-semibold text-neutral-900'}>{savings.toFixed(0)}%</span> with Plunk
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

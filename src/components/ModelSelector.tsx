import React from 'react';
import { CheckSquare, Square, Layers, X, Sparkles, RotateCcw } from 'lucide-react';
import { ModelItem } from '../types';

interface ModelSelectorProps {
  models: ModelItem[];
  onToggleSelect: (modelId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResetToOriginal?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onResetToOriginal,
}) => {
  const selectedCount = models.filter((m) => m.selected).length;
  const allSelected = models.length > 0 && selectedCount === models.length;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-black text-white font-bold shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-neutral-900 uppercase flex items-center gap-2">
              PRODUCT COMPONENTS
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 font-semibold border border-neutral-200">
                {selectedCount} / {models.length} active
              </span>
            </h2>
            <p className="text-[11px] text-neutral-500">
              Modular components representing one integrated Sharp Multi-Function System
            </p>
          </div>
        </div>

        {/* Batch Selection & Reset Controls */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {onResetToOriginal && (
            <button
              onClick={onResetToOriginal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold transition shadow-sm active:scale-95"
              title="Reset all 7 components and restore original product"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>Reset Model</span>
            </button>
          )}

          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 transition font-medium"
          >
            {allSelected ? (
              <>
                <Square className="w-3.5 h-3.5 text-neutral-500" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-black" />
                <span>Select All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Product Components - Aligned evenly across 7 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {models.map((model) => {
          const isSelected = model.selected;
          return (
            <div
              key={model.id}
              onClick={() => onToggleSelect(model.id)}
              className={`relative cursor-pointer rounded-xl p-3 border transition-all duration-150 flex flex-col justify-between select-none h-full min-h-[115px] ${
                isSelected
                  ? 'bg-neutral-50 border-black ring-1 ring-black shadow-sm'
                  : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <div>
                {/* Header row: Checkbox + Part badge */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-black border-black text-white'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckSquare className="w-3.5 h-3.5 stroke-[3] text-white" />}
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isSelected ? 'text-black' : 'text-neutral-500'
                      }`}
                    >
                      {model.partNumber}
                    </span>
                  </div>

                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(model.id);
                      }}
                      className="text-neutral-400 hover:text-black transition"
                      title="Hide component"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Display Name */}
                <h4
                  className={`text-xs font-semibold leading-tight line-clamp-2 mb-1 ${
                    isSelected ? 'text-black font-bold' : 'text-neutral-800'
                  }`}
                  title={model.displayName}
                >
                  {model.displayName}
                </h4>

                {/* Filename */}
                <p className="text-[10px] font-mono text-neutral-400 truncate mb-2" title={model.filename}>
                  {model.filename}
                </p>
              </div>

              {/* Bottom Info: Size */}
              <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between text-[10px] font-mono mt-auto">
                <span className="text-neutral-500">{model.formattedOriginalSize}</span>
                {model.hasCompressedVariant ? (
                  <span className="flex items-center gap-1 text-black font-semibold" title="Meshopt compressed">
                    <Sparkles className="w-3 h-3 text-black" />
                    {model.formattedCompressedSize}
                  </span>
                ) : (
                  <span className="text-neutral-400">GLB</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

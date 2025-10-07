import { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface TemplateNameModalProps {
  isOpen: boolean
  defaultName: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export function TemplateNameModal({ isOpen, defaultName, onConfirm, onCancel }: TemplateNameModalProps) {
  const [templateName, setTemplateName] = useState(defaultName)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (templateName.trim()) {
      onConfirm(templateName.trim())
      setTemplateName('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className="energy-card bg-gradient-to-br from-slate-900 to-slate-800 border-0 sm:border-2 border-blue-500/50 rounded-none sm:rounded-2xl shadow-2xl shadow-blue-500/20 max-w-md w-full min-h-screen sm:min-h-0 p-4 sm:p-6 animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
              <DocumentDuplicateIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Save as Template</h3>
              <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Enter a name for this template</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="mb-4 sm:mb-6 flex-1">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Template Name
            </label>
            <Input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Morning Coffee Maker"
              className="w-full text-base sm:text-lg"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              💡 Choose a descriptive name to easily identify this pattern later
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sticky bottom-0 sm:static bg-gradient-to-br from-slate-900 to-slate-800 pt-2 sm:pt-0 -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 sm:pb-0 border-t sm:border-t-0 border-slate-700">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 py-2.5 sm:py-2 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!templateName.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed py-2.5 sm:py-2 text-sm sm:text-base"
            >
              ✓ Save Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

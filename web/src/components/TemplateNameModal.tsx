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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="energy-card bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-500/50 rounded-2xl shadow-2xl shadow-blue-500/20 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DocumentDuplicateIcon className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Save as Template</h3>
              <p className="text-sm text-slate-400">Enter a name for this template</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Template Name
            </label>
            <Input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Morning Coffee Maker"
              className="w-full text-lg"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              💡 Choose a descriptive name to easily identify this pattern later
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!templateName.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ Save Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

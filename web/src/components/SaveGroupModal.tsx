import { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline'

interface SaveGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (groupName: string) => void
  deviceCount: number
}

export function SaveGroupModal({ isOpen, onClose, onSave, deviceCount }: SaveGroupModalProps) {
  const [groupName, setGroupName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName.trim()) {
      onSave(groupName.trim())
      setGroupName('')
      onClose()
    }
  }

  const handleCancel = () => {
    setGroupName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-[60] p-0 sm:p-4">
      <Card className="energy-card w-full sm:max-w-md border-0 sm:border rounded-none sm:rounded-lg min-h-screen sm:min-h-0">
        <CardHeader className="p-4 sm:p-5 border-b border-border sticky top-0 bg-card z-10">
          <CardTitle className="text-base sm:text-lg text-foreground flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <FolderPlusIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
              <span className="truncate">Save Device Group</span>
            </span>
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-muted rounded flex-shrink-0"
              type="button"
            >
              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                Group Name *
              </label>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Work Setup, Morning Routine"
                autoFocus
                required
                className="w-full text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will save {deviceCount} device{deviceCount !== 1 ? 's' : ''} as a quick-select group
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white border-0 py-2.5 sm:py-2 text-sm sm:text-base"
              >
                Save Group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

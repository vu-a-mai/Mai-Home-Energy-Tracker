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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="energy-card w-full max-w-md">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-lg text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderPlusIcon className="w-6 h-6 text-purple-400" />
              Save Device Group
            </span>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-muted rounded"
              type="button"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-foreground">
                Group Name *
              </label>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Work Setup, Morning Routine"
                autoFocus
                required
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will save {deviceCount} device{deviceCount !== 1 ? 's' : ''} as a quick-select group
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white border-0"
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

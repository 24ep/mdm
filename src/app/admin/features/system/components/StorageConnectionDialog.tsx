'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { StorageConnectionForm, StorageConnectionFormData } from './StorageConnectionForm'

interface StorageConnectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: Partial<StorageConnectionFormData>
    onSubmit: (data: StorageConnectionFormData) => Promise<void>
    title?: string
    description?: string
}

export function StorageConnectionDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit,
    title = 'Storage Connection',
    description = 'Configure storage connection settings',
}: StorageConnectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <StorageConnectionForm
                    initialData={initialData}
                    onSubmit={async (data) => {
                        await onSubmit(data)
                        onOpenChange(false)
                    }}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

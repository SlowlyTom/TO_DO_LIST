import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useUiStore } from '../../stores/uiStore'
import { useDataTransfer } from '../../hooks/useDataTransfer'

export function ImportModal() {
  const { modal, closeModal } = useUiStore()
  const { importData } = useDataTransfer()
  const [mode, setMode] = useState<'overwrite' | 'merge'>('overwrite')
  const [loading, setLoading] = useState(false)

  const isOpen = modal.type === 'importData'
  const file = modal.payload?.file as File | undefined

  async function handleImport() {
    if (!file) return
    setLoading(true)
    try {
      await importData(file, mode)
      closeModal()
      alert('데이터를 성공적으로 가져왔습니다.')
    } catch (e) {
      alert(`가져오기 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="데이터 가져오기" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          파일: <span className="font-medium">{file?.name}</span>
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">가져오기 방식</p>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="importMode"
              value="overwrite"
              checked={mode === 'overwrite'}
              onChange={() => setMode('overwrite')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">덮어쓰기</p>
              <p className="text-xs text-gray-500">기존 데이터를 모두 지우고 백업 데이터로 교체합니다.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="importMode"
              value="merge"
              checked={mode === 'merge'}
              onChange={() => setMode('merge')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">병합</p>
              <p className="text-xs text-gray-500">기존 데이터를 유지하고 백업 데이터를 추가합니다.</p>
            </div>
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={closeModal}>취소</Button>
          <Button className="flex-1" loading={loading} onClick={handleImport}>가져오기</Button>
        </div>
      </div>
    </Modal>
  )
}

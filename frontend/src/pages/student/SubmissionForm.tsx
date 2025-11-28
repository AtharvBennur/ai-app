import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { submissionsApi, uploadApi, rubricsApi, Rubric, Submission } from '../../services/api'
import { Card, CardHeader, CardTitle, Button, Input, Textarea, FileUpload } from '../../components/ui'

export default function SubmissionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [rubricId, setRubricId] = useState('')
  const [file, setFile] = useState<{ name: string; url?: string } | null>(null)
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    loadRubrics()
    if (isEditing) {
      loadSubmission()
    }
  }, [id])

  async function loadRubrics() {
    try {
      const response = await rubricsApi.list()
      if (response.success) {
        setRubrics(response.data)
      }
    } catch (err) {
      console.error('Failed to load rubrics:', err)
    }
  }

  async function loadSubmission() {
    try {
      setLoading(true)
      const response = await submissionsApi.get(id!)
      if (response.success) {
        const sub = response.data
        setExistingSubmission(sub)
        setTitle(sub.title)
        setDescription(sub.description || '')
        setContent(sub.content)
        setRubricId(sub.rubricId || '')
        if (sub.fileName) {
          setFile({ name: sub.fileName, url: sub.fileUrl })
        }
      } else {
        setError(response.error || 'Failed to load submission')
      }
    } catch (err) {
      setError('Failed to load submission')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileSelect(selectedFile: File) {
    try {
      setUploading(true)
      setError(null)
      const response = await uploadApi.uploadFile(selectedFile)
      if (response.success) {
        setFile({
          name: response.data.originalName,
          url: response.data.url,
        })
      } else {
        setError(response.error || 'Failed to upload file')
      }
    } catch (err) {
      setError('Failed to upload file')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveFile() {
    setFile(null)
  }

  async function handleSubmit(e: React.FormEvent, submitForReview = false) {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const data = {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        rubricId: rubricId || undefined,
        fileUrl: file?.url,
        fileName: file?.name,
      }

      let response
      if (isEditing) {
        response = await submissionsApi.update(id!, data)
      } else {
        response = await submissionsApi.create(data)
      }

      if (response.success) {
        const submissionId = isEditing ? id : response.data.id

        if (submitForReview) {
          const submitResponse = await submissionsApi.submit(submissionId!)
          if (!submitResponse.success) {
            setError(submitResponse.error || 'Failed to submit for review')
            return
          }
        }

        navigate('/submissions')
      } else {
        setError(response.error || 'Failed to save submission')
      }
    } catch (err) {
      setError('Failed to save submission')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const canEdit = !existingSubmission || existingSubmission.status === 'draft' || existingSubmission.status === 'returned'

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Submission' : 'New Submission'}</CardTitle>
        </CardHeader>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter assignment title"
            required
            disabled={!canEdit}
          />

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your assignment"
            disabled={!canEdit}
          />

          <Textarea
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your assignment content here..."
            rows={12}
            required
            disabled={!canEdit}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rubric (optional)
            </label>
            <select
              value={rubricId}
              onChange={(e) => setRubricId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!canEdit}
            >
              <option value="">No rubric selected</option>
              {rubrics.map((rubric) => (
                <option key={rubric.id} value={rubric.id}>
                  {rubric.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (optional)
            </label>
            {uploading ? (
              <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Uploading...</span>
              </div>
            ) : (
              <FileUpload
                onFileSelect={handleFileSelect}
                currentFile={file}
                onRemove={handleRemoveFile}
                disabled={!canEdit}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/submissions')}
            >
              Cancel
            </Button>

            <div className="flex gap-3">
              {canEdit && (
                <>
                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={saving}
                    disabled={saving}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    isLoading={saving}
                    disabled={saving}
                  >
                    Submit for Review
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

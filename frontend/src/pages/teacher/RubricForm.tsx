import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { rubricsApi } from '../../services/api'
import { Card, CardHeader, CardTitle, Button, Input, Textarea } from '../../components/ui'

interface CriterionInput {
  name: string
  description: string
  maxScore: number
  weight: number
}

export default function RubricForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [criteria, setCriteria] = useState<CriterionInput[]>([
    { name: '', description: '', maxScore: 25, weight: 100 }
  ])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing) loadRubric()
  }, [id])

  async function loadRubric() {
    try {
      setLoading(true)
      const response = await rubricsApi.get(id!)
      if (response.success) {
        const r = response.data
        setTitle(r.title)
        setDescription(r.description || '')
        setIsPublic(r.isPublic)
        setCriteria(r.criteria.map((c: any) => ({
          name: c.name, description: c.description, maxScore: c.maxScore, weight: c.weight
        })))
      }
    } catch (err) {
      setError('Failed to load rubric')
    } finally {
      setLoading(false)
    }
  }

  function addCriterion() {
    setCriteria([...criteria, { name: '', description: '', maxScore: 25, weight: 0 }])
  }

  function removeCriterion(index: number) {
    if (criteria.length > 1) setCriteria(criteria.filter((_, i) => i !== index))
  }

  function updateCriterion(index: number, field: keyof CriterionInput, value: string | number) {
    const updated = [...criteria]
    updated[index] = { ...updated[index], [field]: value }
    setCriteria(updated)
  }

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (criteria.some(c => !c.name.trim())) { setError('All criteria need names'); return }
    if (totalWeight !== 100) { setError('Weights must sum to 100'); return }

    try {
      setSaving(true)
      const data = { title, description, isPublic, criteria }
      const response = isEditing 
        ? await rubricsApi.update(id!, data)
        : await rubricsApi.create(data)
      if (response.success) navigate('/rubrics')
      else setError(response.error || 'Failed to save')
    } catch (err) {
      setError('Failed to save rubric')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full"></div></div>

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader><CardTitle>{isEditing ? 'Edit' : 'Create'} Rubric</CardTitle></CardHeader>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
            <span className="text-sm">Make visible to students</span>
          </label>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Criteria</span>
              <span className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Weight: {totalWeight}/100
              </span>
            </div>
            {criteria.map((c, i) => (
              <div key={i} className="p-4 border rounded-lg mb-3">
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <Input placeholder="Name" value={c.name} onChange={e => updateCriterion(i, 'name', e.target.value)} />
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Score" value={c.maxScore} onChange={e => updateCriterion(i, 'maxScore', +e.target.value)} />
                    <Input type="number" placeholder="Weight%" value={c.weight} onChange={e => updateCriterion(i, 'weight', +e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Description" value={c.description} onChange={e => updateCriterion(i, 'description', e.target.value)} className="flex-1" />
                  {criteria.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeCriterion(i)}>✕</Button>}
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addCriterion}>+ Add Criterion</Button>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => navigate('/rubrics')}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Save Rubric</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

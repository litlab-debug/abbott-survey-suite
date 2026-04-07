import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSurvey } from '@/context/SurveyContext';
import { CATEGORY_LABELS, SCOPE_LABELS, LANGUAGE_NAMES, Question, QuestionCategory, QuestionType, QuestionScope, Language } from '@/types/survey';
import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Globe, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const languages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'tr'];

export default function QuestionBank() {
  const { mandatoryQuestions, updateMandatoryQuestion, addQuestion, deleteQuestion, permissions } = useSurvey();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    category: 'overall_satisfaction' as QuestionCategory,
    type: 'rating' as QuestionType,
    scope: 'local' as QuestionScope,
    textEn: '',
    required: true,
    isMandatory: false,
  });

  const canManage = permissions.canManageQuestionBank;

  const categories = Object.keys(CATEGORY_LABELS) as QuestionCategory[];
  const questionsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = mandatoryQuestions.filter(q => q.category === cat);
    return acc;
  }, {} as Record<QuestionCategory, Question[]>);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData({
      code: `LQ-${String(mandatoryQuestions.length + 1).padStart(3, '0')}`,
      category: 'overall_satisfaction',
      type: 'rating',
      scope: 'local',
      textEn: '',
      required: true,
      isMandatory: false,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      code: q.code,
      category: q.category,
      type: q.type,
      scope: q.scope,
      textEn: q.text.en,
      required: q.required,
      isMandatory: q.isMandatory,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.textEn || !formData.code) {
      toast({ title: 'Error', description: 'Code and question text are required', variant: 'destructive' });
      return;
    }

    const emptyLangText = {} as Record<Language, string>;
    languages.forEach(l => { emptyLangText[l] = l === 'en' ? formData.textEn : ''; });

    if (editingQuestion) {
      updateMandatoryQuestion(editingQuestion.id, {
        code: formData.code,
        category: formData.category,
        type: formData.type,
        scope: formData.scope,
        text: emptyLangText,
        required: formData.required,
        isMandatory: formData.isMandatory,
      });
      toast({ title: 'Success', description: 'Question updated' });
    } else {
      const newQ: Question = {
        id: `question-${Date.now()}`,
        code: formData.code,
        category: formData.category,
        type: formData.type,
        scope: formData.scope,
        text: emptyLangText,
        required: formData.required,
        isMandatory: formData.isMandatory,
        order: mandatoryQuestions.length + 1,
        isActive: true,
      };
      addQuestion(newQ);
      toast({ title: 'Success', description: 'Question created' });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteQuestion(id);
    toast({ title: 'Success', description: 'Question deleted' });
  };

  return (
    <AppLayout title="Question Bank" description="Global governance of survey questions (Super ADM only)">
      <div className="space-y-6 animate-fade-in">
        {!canManage && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <p className="text-sm text-warning flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Read-only mode. Only Super Admin can manage the question bank.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              9 global mandatory categories · Changes apply to future surveys only (not retroactive)
            </p>
          </div>
          {canManage && (
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          )}
        </div>

        <Accordion type="multiple" defaultValue={categories} className="space-y-3">
          {categories.map(category => (
            <AccordionItem key={category} value={category} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                  <Badge variant="outline" className="text-xs">
                    {questionsByCategory[category].length} questions
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  {questionsByCategory[category].length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No questions in this category</p>
                  ) : (
                    questionsByCategory[category].map(question => (
                      <div key={question.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{question.code}</span>
                            <Badge variant="outline" className="text-xs">{question.type}</Badge>
                            {question.scope === 'global' ? (
                              <Badge className="bg-primary/10 text-primary text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                Global
                              </Badge>
                            ) : (
                              <Badge className="bg-accent text-accent-foreground text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                Local
                              </Badge>
                            )}
                            {question.isMandatory && (
                              <Badge className="bg-destructive/10 text-destructive text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Mandatory
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{question.text.en}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {canManage && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(question)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!question.isMandatory && (
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(question.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          <Switch
                            checked={question.isActive}
                            onCheckedChange={(checked) => canManage && updateMandatoryQuestion(question.id, { isActive: checked })}
                            disabled={!canManage}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="e.g. LQ-BR-01" />
                </div>
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select value={formData.scope} onValueChange={(v) => setFormData(p => ({ ...p, scope: v as QuestionScope }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v as QuestionCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v as QuestionType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nps">NPS (0-10)</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="likert">Likert Scale</SelectItem>
                      <SelectItem value="text">Free Text</SelectItem>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="yes_no">Yes/No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Question Text (EN) *</Label>
                <Textarea
                  value={formData.textEn}
                  onChange={(e) => setFormData(p => ({ ...p, textEn: e.target.value }))}
                  placeholder="Enter the question in English..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Translations can be managed after creation</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingQuestion ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

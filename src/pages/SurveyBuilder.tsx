import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSurvey } from '@/context/SurveyContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Survey,
  Language,
  Channel,
  LANGUAGE_NAMES,
  COUNTRIES,
  CHANNEL_NAMES,
  CATEGORY_LABELS,
  SCOPE_LABELS,
  Question,
} from '@/types/survey';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Trash2,
  GripVertical,
  Calendar,
  Globe,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const languages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'tr'];
const channels: Channel[] = ['email', 'sms', 'web', 'phone'];

const emptyMsg = { subject: '', body: '' };
const defaultMessages = () => ({
  invite: { en: { subject: 'We value your feedback', body: 'Dear {CustomerName}, we would appreciate your feedback.' }, es: emptyMsg, fr: emptyMsg, de: emptyMsg, it: emptyMsg, pt: emptyMsg, zh: emptyMsg, ja: emptyMsg, tr: emptyMsg },
  reminder: { en: { subject: 'Reminder: We value your feedback', body: 'This is a friendly reminder to complete our survey.' }, es: emptyMsg, fr: emptyMsg, de: emptyMsg, it: emptyMsg, pt: emptyMsg, zh: emptyMsg, ja: emptyMsg, tr: emptyMsg },
  closing: { en: { subject: 'Thank you for your feedback', body: 'Thank you for completing our survey.' }, es: emptyMsg, fr: emptyMsg, de: emptyMsg, it: emptyMsg, pt: emptyMsg, zh: emptyMsg, ja: emptyMsg, tr: emptyMsg },
});

const defaultSurvey: Partial<Survey> = {
  name: '',
  description: '',
  status: 'draft',
  languages: ['en'],
  primaryLanguage: 'en',
  countries: [],
  channels: ['email'],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  questions: [],
  messages: defaultMessages(),
  ccEmails: [],
  targetCount: 0,
  responseCount: 0,
  reminderSchedule: { firstReminder: 3, secondReminder: 1 },
};

export default function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getSurvey, createSurvey, updateSurvey, mandatoryQuestions, publishSurvey, permissions } = useSurvey();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Partial<Survey>>(defaultSurvey);
  const [selectedMessageLang, setSelectedMessageLang] = useState<Language>('en');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      const survey = getSurvey(id);
      if (survey) setFormData(survey);
    } else {
      setFormData(prev => ({
        ...prev,
        questions: mandatoryQuestions.filter(q => q.isActive),
      }));
    }
  }, [id, getSurvey, mandatoryQuestions]);

  const updateFormData = <K extends keyof Survey>(key: K, value: Survey[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (lang: Language) => {
    const current = formData.languages || [];
    if (current.includes(lang)) {
      if (current.length > 1) {
        updateFormData('languages', current.filter(l => l !== lang));
        if (formData.primaryLanguage === lang) {
          updateFormData('primaryLanguage', current.filter(l => l !== lang)[0]);
        }
      }
    } else {
      updateFormData('languages', [...current, lang]);
    }
  };

  const toggleCountry = (country: string) => {
    const current = formData.countries || [];
    if (current.includes(country)) {
      updateFormData('countries', current.filter(c => c !== country));
    } else {
      updateFormData('countries', [...current, country]);
    }
  };

  const toggleChannel = (channel: Channel) => {
    const current = formData.channels || [];
    if (current.includes(channel)) {
      if (current.length > 1) {
        updateFormData('channels', current.filter(c => c !== channel));
      }
    } else {
      updateFormData('channels', [...current, channel]);
    }
  };

  const updateMessage = (type: 'invite' | 'reminder' | 'closing', field: 'subject' | 'body', value: string) => {
    setFormData(prev => ({
      ...prev,
      messages: {
        ...prev.messages!,
        [type]: {
          ...prev.messages![type],
          [selectedMessageLang]: {
            ...prev.messages![type][selectedMessageLang],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Survey name is required', variant: 'destructive' });
      return;
    }
    if (isEditing && id) {
      updateSurvey(id, formData as Partial<Survey>);
      toast({ title: 'Success', description: 'Survey updated successfully' });
    } else {
      const newSurvey = createSurvey({
        ...formData,
        createdBy: 'user-1',
      } as Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>);
      toast({ title: 'Success', description: 'Survey created successfully' });
      navigate(`/surveys/${newSurvey.id}`);
    }
  };

  // Publication checklist
  const publishChecks = [
    { label: 'Survey name defined', ok: !!formData.name },
    { label: 'At least one country selected', ok: (formData.countries?.length || 0) > 0 },
    { label: 'At least one language selected', ok: (formData.languages?.length || 0) > 0 },
    { label: 'Questions configured', ok: (formData.questions?.length || 0) > 0 },
    { label: 'Start/End dates defined', ok: !!formData.startDate && !!formData.endDate },
    { label: 'End date > Start date', ok: !!(formData.startDate && formData.endDate && formData.endDate > formData.startDate) },
    { label: 'Invitation message configured', ok: !!formData.messages?.invite?.en?.subject },
  ];
  const allChecksPass = publishChecks.every(c => c.ok);

  const handlePublish = () => {
    if (!allChecksPass) {
      toast({ title: 'Error', description: 'Please complete all required fields before publishing', variant: 'destructive' });
      return;
    }
    if (isEditing && id) {
      handleSave();
      publishSurvey(id);
      toast({ title: 'Success', description: 'Survey published successfully. Invitations will be sent on StartDate.' });
      navigate(`/surveys/${id}`);
    }
    setPublishDialogOpen(false);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Calendar },
    { id: 'scope', label: 'Scope', icon: Globe },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  return (
    <AppLayout 
      title={isEditing ? 'Edit Survey' : 'Create Survey'} 
      description="Configure your customer satisfaction survey"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/surveys')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surveys
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={!permissions.canEditSurvey}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {formData.status === 'draft' && permissions.canPublishSurvey && (
              <Button onClick={() => setPublishDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Publish Survey
              </Button>
            )}
          </div>
        </div>

        {/* Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Survey Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Q4 2025 Customer Satisfaction Survey"
                      value={formData.name || ''}
                      onChange={(e) => updateFormData('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the purpose of this survey..."
                      value={formData.description || ''}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input id="startDate" type="date" value={formData.startDate || ''} onChange={(e) => updateFormData('startDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input id="endDate" type="date" value={formData.endDate || ''} onChange={(e) => updateFormData('endDate', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>1st Reminder (days before EndDate) — T-</Label>
                      <Input type="number" value={formData.reminderSchedule?.firstReminder || 3} onChange={(e) => updateFormData('reminderSchedule', { ...formData.reminderSchedule!, firstReminder: parseInt(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>2nd Reminder (days before EndDate) — T-</Label>
                      <Input type="number" value={formData.reminderSchedule?.secondReminder || 1} onChange={(e) => updateFormData('reminderSchedule', { ...formData.reminderSchedule!, secondReminder: parseInt(e.target.value) })} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scope Tab */}
          <TabsContent value="scope">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="enterprise-card">
                <CardHeader><CardTitle>Languages</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Select value={formData.primaryLanguage} onValueChange={(v) => updateFormData('primaryLanguage', v as Language)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {formData.languages?.map(lang => (
                          <SelectItem key={lang} value={lang}>{LANGUAGE_NAMES[lang]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Available Languages</Label>
                    <p className="text-xs text-muted-foreground">1 Microsoft Forms will be created per active language</p>
                    <div className="flex flex-wrap gap-2">
                      {languages.map(lang => (
                        <Badge key={lang} variant={formData.languages?.includes(lang) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleLanguage(lang)}>
                          {LANGUAGE_NAMES[lang]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="enterprise-card">
                <CardHeader><CardTitle>Channels</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {channels.map(channel => (
                      <Badge key={channel} variant={formData.channels?.includes(channel) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleChannel(channel)}>
                        {CHANNEL_NAMES[channel]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="enterprise-card lg:col-span-2">
                <CardHeader><CardTitle>Countries</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map(country => (
                      <Badge key={country} variant={formData.countries?.includes(country) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleCountry(country)}>
                        {country}
                      </Badge>
                    ))}
                  </div>
                  {formData.countries?.length === 0 && (
                    <p className="text-sm text-destructive mt-2">Select at least one country</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card className="enterprise-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Survey Questions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    9 mandatory global categories are always included. Local questions can be added per category.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.questions?.map((question, index) => (
                    <div key={question.id} className="flex items-start gap-3 p-4 border border-border rounded-lg">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Q{index + 1}</span>
                          <Badge variant="outline" className="text-xs">{question.type.replace('_', ' ')}</Badge>
                          <Badge variant="outline" className="text-xs">{SCOPE_LABELS[question.scope]}</Badge>
                          {question.isMandatory && (
                            <Badge className="bg-primary/10 text-primary text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Mandatory
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[question.category]}</Badge>
                        </div>
                        <p className="text-sm">{question.text.en}</p>
                        <p className="text-xs text-muted-foreground mt-1">Code: {question.code}</p>
                      </div>
                      {!question.isMandatory && (
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="enterprise-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Templates</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Variables: {'{SurveyName}'}, {'{EndDate}'}, {'{LinkForms}'}, {'{SupportEmail}'}, {'{Country}'}, {'{CustomerName}'}
                    </p>
                  </div>
                  <Select value={selectedMessageLang} onValueChange={(v) => setSelectedMessageLang(v as Language)}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {formData.languages?.map(lang => (
                        <SelectItem key={lang} value={lang}>{LANGUAGE_NAMES[lang]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {(['invite', 'reminder', 'closing'] as const).map(type => (
                  <div key={type} className="space-y-4">
                    <h4 className="font-medium capitalize">{type === 'invite' ? 'Invitation' : type === 'reminder' ? 'Reminder' : 'Thank You'} Email</h4>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={formData.messages?.[type]?.[selectedMessageLang]?.subject || ''}
                        onChange={(e) => updateMessage(type, 'subject', e.target.value)}
                        placeholder="Email subject line..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Body</Label>
                      <Textarea
                        value={formData.messages?.[type]?.[selectedMessageLang]?.body || ''}
                        onChange={(e) => updateMessage(type, 'body', e.target.value)}
                        placeholder="Email body content..."
                        rows={4}
                      />
                    </div>
                  </div>
                ))}

                {/* CC Emails */}
                <div className="space-y-4">
                  <h4 className="font-medium">CC Recipients</h4>
                  <Input
                    placeholder="Enter email addresses separated by commas"
                    value={formData.ccEmails?.join(', ') || ''}
                    onChange={(e) => updateFormData('ccEmails', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              if (idx > 0) setActiveTab(tabs[idx - 1].id);
            }}
            disabled={activeTab === tabs[0].id}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={() => {
              const idx = tabs.findIndex(t => t.id === activeTab);
              if (idx < tabs.length - 1) {
                setActiveTab(tabs[idx + 1].id);
              } else {
                handleSave();
              }
            }}
          >
            {activeTab === tabs[tabs.length - 1].id ? (
              <><Save className="h-4 w-4 mr-2" />Save Survey</>
            ) : (
              <>Next<ArrowRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </div>

        {/* Publish Checklist Dialog (S07) */}
        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publication Checklist</DialogTitle>
              <DialogDescription>
                Review all requirements before publishing. Once published, the survey cannot be edited.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {publishChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-3">
                  {check.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                  <span className={`text-sm ${check.ok ? 'text-foreground' : 'text-destructive font-medium'}`}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">Upon publishing:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>1 Microsoft Forms will be created per active language</li>
                <li>Question versions will be frozen (snapshot)</li>
                <li>Invitations will be scheduled for StartDate</li>
                <li>Reminders scheduled at T-{formData.reminderSchedule?.firstReminder} and T-{formData.reminderSchedule?.secondReminder}</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
              <Button onClick={handlePublish} disabled={!allChecksPass}>
                <Send className="h-4 w-4 mr-2" />
                Confirm & Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

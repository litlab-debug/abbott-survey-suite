import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSurvey } from '@/context/SurveyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Language, LANGUAGE_NAMES } from '@/types/survey';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RespondentSurvey() {
  const { id } = useParams();
  const { toast } = useToast();
  const { getSurvey, submitResponse } = useSurvey();
  
  const survey = getSurvey(id!);
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [respondentInfo, setRespondentInfo] = useState({ customerId: '', email: '', name: '', company: '' });
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [npsComment, setNpsComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  if (!survey || survey.status !== 'active') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Survey Not Available</h2>
            <p className="text-muted-foreground">This survey is no longer active or accepting responses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = survey.questions.filter(q => q.isActive);
  const npsQuestion = questions.find(q => q.type === 'nps');
  const npsScore = npsQuestion ? answers[npsQuestion.id] as number : undefined;
  const needsNpsComment = npsScore !== undefined && npsScore <= 6;

  // Steps: 0=welcome/identify, 1..N=questions, N+1=NPS comment (if needed), N+2=review
  const totalSteps = questions.length + 2 + (needsNpsComment ? 1 : 0);
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSubmit = () => {
    const completionTime = Math.round((Date.now() - startTime) / 1000);

    submitResponse({
      surveyId: survey.id,
      targetId: `respondent-${Date.now()}`,
      customerId: respondentInfo.customerId,
      respondentEmail: respondentInfo.email,
      answers,
      npsScore,
      npsComment: needsNpsComment ? npsComment : undefined,
      finalFeedback: answers['q-feedback'] as string || undefined,
      language,
      channel: 'web',
      country: 'United States',
      completionTime,
    });

    setSubmitted(true);
    toast({ title: 'Thank you!', description: 'Your response has been submitted.' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">Your feedback has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnNpsCommentStep = needsNpsComment && step === questions.length + 1;
  const isOnReviewStep = step === questions.length + 1 + (needsNpsComment ? 1 : 0);
  const isOnQuestionStep = step > 0 && step <= questions.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CS</span>
            </div>
            <span className="font-semibold">Customer Survey</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <Progress value={progress} className="mb-8" />

        {/* Step 0: Identification */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{survey.description}</p>
              <Badge variant="outline" className="text-xs">Estimated time: ~3 minutes</Badge>
              <div className="space-y-2">
                <Label>Select your language</Label>
                <RadioGroup value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  {survey.languages.map(lang => (
                    <div key={lang} className="flex items-center space-x-2">
                      <RadioGroupItem value={lang} id={lang} />
                      <Label htmlFor={lang}>{LANGUAGE_NAMES[lang]}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium">Please identify yourself</p>
                <div className="space-y-2">
                  <Label>Customer ID *</Label>
                  <Input value={respondentInfo.customerId} onChange={(e) => setRespondentInfo(p => ({ ...p, customerId: e.target.value }))} placeholder="Your customer/account ID" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={respondentInfo.email} onChange={(e) => setRespondentInfo(p => ({ ...p, email: e.target.value }))} placeholder="your.email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={respondentInfo.name} onChange={(e) => setRespondentInfo(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={respondentInfo.company} onChange={(e) => setRespondentInfo(p => ({ ...p, company: e.target.value }))} />
                </div>
              </div>
              <Button onClick={() => setStep(1)} disabled={!respondentInfo.customerId || !respondentInfo.email} className="w-full">
                Start Survey
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Question Steps */}
        {isOnQuestionStep && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question {step} of {questions.length}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const question = questions[step - 1];
                return (
                  <>
                    <p className="font-medium">{question.text[language] || question.text.en}</p>
                    
                    {question.type === 'nps' && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Not at all likely</span>
                          <span>Extremely likely</span>
                        </div>
                        <div className="grid grid-cols-11 gap-1">
                          {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                            <Button key={n} variant={answers[question.id] === n ? 'default' : 'outline'} size="sm"
                              onClick={() => setAnswers(p => ({ ...p, [question.id]: n }))}>
                              {n}
                            </Button>
                          ))}
                        </div>
                        {answers[question.id] !== undefined && (answers[question.id] as number) <= 6 && (
                          <div className="flex items-center gap-2 text-sm text-warning mt-2">
                            <AlertCircle className="h-4 w-4" />
                            A comment will be requested on the next step
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === 'rating' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Very dissatisfied</span>
                          <span>Very satisfied</span>
                        </div>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(n => (
                            <Button key={n} variant={answers[question.id] === n ? 'default' : 'outline'} size="lg"
                              onClick={() => setAnswers(p => ({ ...p, [question.id]: n }))}>
                              {n}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === 'text' && (
                      <Textarea placeholder="Your feedback..." value={answers[question.id] as string || ''}
                        onChange={(e) => setAnswers(p => ({ ...p, [question.id]: e.target.value }))} rows={4} />
                    )}

                    {question.type === 'yes_no' && (
                      <div className="flex gap-3">
                        <Button variant={answers[question.id] === 'yes' ? 'default' : 'outline'} onClick={() => setAnswers(p => ({ ...p, [question.id]: 'yes' }))}>Yes</Button>
                        <Button variant={answers[question.id] === 'no' ? 'default' : 'outline'} onClick={() => setAnswers(p => ({ ...p, [question.id]: 'no' }))}>No</Button>
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
                <Button onClick={() => setStep(s => s + 1)}>
                  {step === questions.length ? (needsNpsComment ? 'Next' : 'Review') : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NPS Comment Step (mandatory when NPS ≤ 6) */}
        {isOnNpsCommentStep && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Please tell us more
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                You gave a score of <strong>{npsScore}</strong>. We'd love to understand what we can improve. This comment is required.
              </p>
              <Textarea
                placeholder="Please share what led to your score and how we can improve..."
                value={npsComment}
                onChange={(e) => setNpsComment(e.target.value)}
                rows={5}
              />
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
                <Button onClick={() => setStep(s => s + 1)} disabled={!npsComment.trim()}>
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review & Submit */}
        {isOnReviewStep && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Before submitting your responses, please confirm that your answers are complete.
              </p>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p><strong>Customer ID:</strong> {respondentInfo.customerId}</p>
                <p><strong>Email:</strong> {respondentInfo.email}</p>
                <p><strong>Questions answered:</strong> {Object.keys(answers).length} of {questions.length}</p>
                {npsScore !== undefined && (
                  <p><strong>NPS Score:</strong> {npsScore}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
                <Button onClick={handleSubmit} className="flex-1">Submit Response</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

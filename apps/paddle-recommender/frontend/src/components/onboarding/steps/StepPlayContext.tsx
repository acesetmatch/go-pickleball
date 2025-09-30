import React, { useState } from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ExternalLink } from 'lucide-react';

const SKILL_LEVELS = [
    {
        id: 'beginner',
        label: 'Beginner',
        dupr: '2.00–2.99',
        utrp: '1.0–2.9',
        utpr: '1.0–1.9',
        rating: 2.5,
        description: 'Learning fundamentals and basic shots'
    },
    {
        id: 'intermediate',
        label: 'Intermediate',
        dupr: '3.00–3.99',
        utrp: '3.0–3.9',
        utpr: '2.0–2.9',
        rating: 3.5,
        description: 'Consistent play with developing strategy'
    },
    {
        id: 'advanced',
        label: 'Advanced',
        dupr: '4.0–4.99',
        utrp: '4.0–4.9',
        utpr: '3.0–3.9',
        rating: 4.5,
        description: 'Strong fundamentals with tactical awareness'
    },
    {
        id: 'expert',
        label: 'Expert/Pro',
        dupr: '5.0–8.0',
        utrp: '5.0–10.0',
        utpr: '4.0–6.0',
        rating: 6.0,
        description: 'Elite level play and competition'
    }
];

const STYLE_OPTIONS = [
    { id: 'aggressive', label: 'Aggressive', description: 'Attack-oriented, go for winners' },
    { id: 'all_court', label: 'All Court', description: 'Versatile, play from anywhere' },
    { id: 'reset_first', label: 'Reset First', description: 'Defensive, reset to neutral' },
    { id: 'hand_speed', label: 'Hand Speed', description: 'Quick hands, fast exchanges' },
    { id: 'singles', label: 'Singles', description: 'Singles-focused strategy' },
    { id: 'driving_banger', label: 'Driving Banger', description: 'Power shots, drive game' },
    { id: 'soft_game', label: 'Soft Game', description: 'Finesse, drops and dinks' },
    { id: 'flicker', label: 'Flicker', description: 'Deceptive, varied pace' }
];

const MICRO_QUIZ_QUESTIONS = [
    {
        question: "How often do you win points at the net?",
        answers: [
            { text: "Rarely, I mostly stay back", score: 0 },
            { text: "Sometimes, still learning", score: 1 },
            { text: "Often, comfortable at net", score: 2 },
            { text: "Most of the time, strong net game", score: 3 },
            { text: "Almost always, dominant at net", score: 4 }
        ]
    },
    {
        question: "How consistent are your serves?",
        answers: [
            { text: "Hit and miss, working on basics", score: 0 },
            { text: "Usually get it in, basic placement", score: 1 },
            { text: "Consistent with some strategy", score: 2 },
            { text: "Very consistent, good placement", score: 3 },
            { text: "Weapon-level serves", score: 4 }
        ]
    },
    {
        question: "How do you handle fast exchanges?",
        answers: [
            { text: "Struggle to keep up", score: 0 },
            { text: "Can participate but make errors", score: 1 },
            { text: "Hold my own in most exchanges", score: 2 },
            { text: "Thrive in fast-paced rallies", score: 3 },
            { text: "Dominate speed-up exchanges", score: 4 }
        ]
    }
];

const RATING_EXAMPLES = {
    2.5: "New to pickleball, learning basic rules and strokes",
    3.0: "Consistent serve and return, developing court positioning",
    3.5: "Good fundamentals, starting strategic play and net game",
    4.0: "Strong all-around game, consistent shot placement and strategy",
    4.5: "Advanced player with excellent court control and shot variety",
    5.0: "Tournament-level play with mastery of all aspects"
};

export default function StepPlayContext() {
    const { profile, setPlayContext } = useOnboardingStore();
    const playContext = profile.play || {};
    const [quizOpen, setQuizOpen] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<string>('');

    // Initialize selected level from profile
    React.useEffect(() => {
        if (playContext.rating) {
            const level = SKILL_LEVELS.find(l => Math.abs(l.rating - playContext.rating) < 0.6);
            if (level) setSelectedLevel(level.id);
        }
    }, [playContext.rating]);

    const handleLevelChange = (levelId: string) => {
        setSelectedLevel(levelId);
        const level = SKILL_LEVELS.find(l => l.id === levelId);
        if (level) {
            setPlayContext({ rating: level.rating });
        }
    };

    const handleQuizAnswer = (questionIndex: number, score: number) => {
        const newAnswers = [...quizAnswers];
        newAnswers[questionIndex] = score;
        setQuizAnswers(newAnswers);
    };

    const completeQuiz = () => {
        if (quizAnswers.length === MICRO_QUIZ_QUESTIONS.length) {
            // Calculate score and map to level
            const totalScore = quizAnswers.reduce((sum, score) => sum + score, 0);
            const avgScore = totalScore / quizAnswers.length;
            
            // Map score to level: 0-1 → Beginner, 2-3 → Intermediate, 4 → Advanced, 5 → Expert/Pro
            let levelId = 'beginner';
            if (avgScore >= 3.5) levelId = 'expert';
            else if (avgScore >= 2.5) levelId = 'advanced';
            else if (avgScore >= 1.5) levelId = 'intermediate';
            
            handleLevelChange(levelId);
            setQuizOpen(false);
            setQuizAnswers([]);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Skill Level & Context</CardTitle>
                <CardDescription>
                    Tell us about your rating, game format, and competitive level
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Level Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Your Skill Level</Label>
                        <div className="flex items-center gap-2">
                            <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <HelpCircle className="w-4 h-4 mr-1" />
                                        I'm not sure
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Quick Skill Assessment</DialogTitle>
                                        <DialogDescription>
                                            Answer a few questions to estimate your level
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        {MICRO_QUIZ_QUESTIONS.map((q, qIndex) => (
                                            <div key={qIndex} className="space-y-2">
                                                <h4 className="font-medium text-sm">{q.question}</h4>
                                                <RadioGroup
                                                    value={quizAnswers[qIndex]?.toString() || ''}
                                                    onValueChange={(value) => handleQuizAnswer(qIndex, parseInt(value))}
                                                >
                                                    {q.answers.map((answer, aIndex) => (
                                                        <div key={aIndex} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={answer.score.toString()} id={`q${qIndex}a${aIndex}`} />
                                                            <Label htmlFor={`q${qIndex}a${aIndex}`} className="text-xs">
                                                                {answer.text}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        ))}
                                        <Button
                                            onClick={completeQuiz}
                                            disabled={quizAnswers.length !== MICRO_QUIZ_QUESTIONS.length}
                                            className="w-full"
                                        >
                                            Get My Level
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                            >
                                <a
                                    href="https://usapickleball.org/what-is-pickleball/player-skill-rating-definitions/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                >
                                    What's my level?
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Level Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SKILL_LEVELS.map((level) => (
                            <TooltipProvider key={level.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Card 
                                            className={`cursor-pointer transition-all hover:shadow-md ${
                                                selectedLevel === level.id 
                                                    ? 'ring-2 ring-primary bg-primary/5' 
                                                    : 'hover:border-primary/50'
                                            }`}
                                            onClick={() => handleLevelChange(level.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold">{level.label}</h3>
                                                    <Badge variant="secondary" className="text-xs">
                                                        DUPR {level.dupr}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {level.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-xs">
                                        <div className="space-y-1 text-xs">
                                            <div><strong>DUPR:</strong> {level.dupr}</div>
                                            <div><strong>UTR-P:</strong> {level.utrp}</div>
                                            <div><strong>UTPR:</strong> {level.utpr}</div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>

                {/* Game Format */}
                <div className="space-y-3">
                    <Label>What do you primarily play?</Label>
                    <RadioGroup
                        value={playContext.plays || ''}
                        onValueChange={(value) => setPlayContext({ plays: value as 'singles' | 'doubles' | 'both' })}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="singles" id="singles" />
                            <Label htmlFor="singles">Singles</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="doubles" id="doubles" />
                            <Label htmlFor="doubles">Doubles</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="both" />
                            <Label htmlFor="both">Both equally</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Competitive Level */}
                <div className="space-y-3">
                    <Label>Competitive Level</Label>
                    <RadioGroup
                        value={playContext.competitive || ''}
                        onValueChange={(value) => setPlayContext({ competitive: value as 'rec' | 'league' | 'tournament' })}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="rec" id="rec" />
                            <Label htmlFor="rec">Recreational</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="league" id="league" />
                            <Label htmlFor="league">League Play</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="tournament" id="tournament" />
                            <Label htmlFor="tournament">Tournament Play</Label>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
    );
}

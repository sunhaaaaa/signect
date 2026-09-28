import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useWebcam } from '../hooks/useWebcam'
import { useHandTracking } from '../hooks/useHandTracking'
import { useSignMatch } from '../hooks/useSignMatch'
import { useSignReferences } from '../hooks/useSignReferences'
import { useWordMotionReference } from '../hooks/useWordMotionReference'
import { useMotionRecorder } from '../hooks/useMotionRecorder'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { dtwScore } from '../lib/dtw'
import { DEFAULT_MATCH_THRESHOLD } from '../lib/signMatcher'
import { markMastered, toggleWordListEntry, isInWordList } from '../lib/progressStore'
import { SignAnimationPlayer } from '../components/learn/SignAnimationPlayer'
import { StaticHandGuide } from '../components/learn/StaticHandGuide'
import { PixelGlyph, TOPIC_ICON_KIND, topicGlyphKind } from '../components/brand/PixelTopicIcon'
import {
  LEARN_TABS,
  LETTER_CURRICULUM,
  NUMBER_CURRICULUM,
  curriculumId,
  type CurriculumItem,
  type LearnTab,
} from '../data/curriculum'

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`

const TabButton = styled.button<{ $active: boolean }>`
  padding: 10px 14px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 13px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme, $active }) => ($active ? 'none' : theme.shadow.cardSm)};
  transform: ${({ $active }) => ($active ? 'translate(3px, 3px)' : 'none')};
`

const TopicGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
`

const TopicCard = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 16px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
`

const TopicIcon = styled.span`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.outline};
`

const TopicName = styled.div`
  font-weight: 700;
  font-size: 15px;
`

const TopicCount = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const BackRow = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 16px;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 13px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  margin-right: 4px;
`

const CurrentTopicLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
  margin-left: 10px;
`

const WordHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`

const WordTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const WordProgressText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

const HeaderProgressTrack = styled.div`
  width: 100%;
  height: 10px;
  border: 2px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  margin-bottom: 24px;
`

const HeaderProgressFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => $pct}%;
  height: 100%;
  background: ${({ theme }) => theme.colors.gold};
  transition: width 0.2s steps(6);
`

const CompareGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`

const PanelLabel = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
`

const CameraBox = styled.div<{ $status: 'idle' | 'correct' | 'incorrect' }>`
  position: relative;
  aspect-ratio: 4 / 3;
  background: #0d1020;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid
    ${({ $status, theme }) =>
      $status === 'correct'
        ? theme.colors.success
        : $status === 'incorrect'
          ? theme.colors.error
          : theme.colors.outline};
  transition: border-color 0.15s steps(1);
`

const ScoreBadge = styled.span<{ $status: 'idle' | 'correct' | 'incorrect' }>`
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2;
  background: ${({ $status, theme }) =>
    $status === 'correct' ? theme.colors.success : $status === 'incorrect' ? theme.colors.error : 'rgba(0, 0, 0, 0.55)'};
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: white;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 10px;
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`

const LandmarkCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
  pointer-events: none;
`

const LiveBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: ${({ theme }) => theme.colors.error};
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: white;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 11px;
  padding: 4px 8px;
`

const ModelBadge = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.55);
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: #f1f1f5;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px;
`

const Placeholder = styled.p`
  color: #9aa0c3;
  font-size: 16px;
`

const HintList = styled.ul`
  margin: 0 0 16px;
  padding-left: 18px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`

const NavRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`

const IntroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 640px;
  margin: 20px auto;
`

const IntroCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
`

const IntroIcon = styled.span`
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.outline};
`

const IntroLabel = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 15px;
`

const WordListGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`

const WordListChip = styled.button`
  padding: 10px 14px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 16px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
`

export default function Learn() {
  useStudyTimer()
  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, handedness, isModelLoading, modelError } = useHandTracking(
    videoRef,
    canvasRef,
    isActive,
  )
  const { references, isLoading: isReferencesLoading } = useSignReferences()
  const [searchParams] = useSearchParams()

  // 대분류(topic) → 소분류(subtopic) breakdown. A topic with only one
  // subtopic (small categories where subtopic === topic, see
  // classify_word_topics.py) has no useful drill-down step, so it's flagged
  // via subtopics.length <= 1 and skipped straight to the word list.
  const wordTopics = useMemo(() => {
    const byTopic = new Map<string, { all: Set<string>; subtopics: Map<string, Set<string>> }>()
    for (const r of references) {
      if (r.category !== 'word') continue
      const topic = r.topic ?? '기타'
      const subtopic = r.subtopic ?? topic
      if (!byTopic.has(topic)) byTopic.set(topic, { all: new Set(), subtopics: new Map() })
      const entry = byTopic.get(topic)!
      entry.all.add(r.label)
      if (!entry.subtopics.has(subtopic)) entry.subtopics.set(subtopic, new Set())
      entry.subtopics.get(subtopic)!.add(r.label)
    }
    return Array.from(byTopic.entries())
      .map(([topic, { all, subtopics }]) => ({
        topic,
        count: all.size,
        subtopics: Array.from(subtopics.entries())
          .map(([subtopic, labels]) => ({ subtopic, count: labels.size }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count)
  }, [references])

  // null = the very first landing screen (choose 지숫자/지문자/단어, no
  // category content shown yet). Once a tab is picked it's never null again
  // for that visit — switchTab lets you swap between the three afterwards.
  const [tab, setTab] = useState<LearnTab | null>(null)
  const [wordTopic, setWordTopic] = useState<string | null>(null)
  const [wordSubtopic, setWordSubtopic] = useState<string | null>(null)
  // 지문자 only: split into 자음/모음 before showing that group's item list.
  const [letterGroup, setLetterGroup] = useState<'consonant' | 'vowel' | 'all' | null>(null)
  // Every tab shows a LIST of its items before the single-item practice
  // screen — `started` gates that final step, for number/letter/word alike.
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)

  const wordCurriculum = useMemo<CurriculumItem[]>(() => {
    if (wordTopic === null || wordSubtopic === null) return []
    const labels = Array.from(
      new Set(
        references
          .filter((r) => {
            if (r.category !== 'word') return false
            if (wordTopic === 'all') return true
            if ((r.topic ?? '기타') !== wordTopic) return false
            if (wordSubtopic === 'all') return true
            return (r.subtopic ?? r.topic ?? '기타') === wordSubtopic
          })
          .map((r) => r.label),
      ),
    )
    labels.sort((a, b) => a.localeCompare(b, 'ko'))
    return labels.map((label) => ({ id: `word-${label}`, label, category: 'word' as const }))
  }, [references, wordTopic, wordSubtopic])

  const letterCurriculum = useMemo(
    () =>
      letterGroup && letterGroup !== 'all'
        ? LETTER_CURRICULUM.filter((item) => item.category === letterGroup)
        : LETTER_CURRICULUM,
    [letterGroup],
  )

  const curriculum: CurriculumItem[] =
    tab === 'number' ? NUMBER_CURRICULUM : tab === 'letter' ? letterCurriculum : wordCurriculum
  const currentItem = curriculum[index]
  const showingWordPicker = tab === 'word' && wordTopic === null
  const showingSubtopicPicker = tab === 'word' && wordTopic !== null && wordTopic !== 'all' && wordSubtopic === null
  const showingWordListPicker = tab === 'word' && wordTopic !== null && wordSubtopic !== null && !started
  const showingLetterGroupPicker = tab === 'letter' && letterGroup === null
  const showingItemListPicker =
    (tab === 'number' || (tab === 'letter' && letterGroup !== null)) && !started

  const switchTab = (nextTab: LearnTab) => {
    setTab(nextTab)
    setIndex(0)
    setStarted(false)
    if (nextTab === 'word') {
      setWordTopic(null)
      setWordSubtopic(null)
    }
    if (nextTab === 'letter') setLetterGroup(null)
  }

  const chooseLetterGroup = (group: 'consonant' | 'vowel' | 'all') => {
    setLetterGroup(group)
    setStarted(false)
    setIndex(0)
  }

  const backToLetterGroups = () => {
    setLetterGroup(null)
    setStarted(false)
    setIndex(0)
  }

  const backToStart = () => {
    setTab(null)
    setWordTopic(null)
    setWordSubtopic(null)
    setLetterGroup(null)
    setStarted(false)
    setIndex(0)
  }

  const chooseTopic = (topic: string) => {
    setIndex(0)
    setStarted(false)
    if (topic === 'all') {
      setWordTopic('all')
      setWordSubtopic('all')
      return
    }
    setWordTopic(topic)
    const entry = wordTopics.find((t) => t.topic === topic)
    // A topic with only one subtopic has nothing to drill into — go
    // straight to its word list instead of showing a single-card screen.
    setWordSubtopic(!entry || entry.subtopics.length <= 1 ? 'all' : null)
  }

  const chooseSubtopic = (subtopic: string) => {
    setWordSubtopic(subtopic)
    setStarted(false)
    setIndex(0)
  }

  const chooseWord = (label: string) => {
    const foundIndex = wordCurriculum.findIndex((item) => item.label === label)
    setIndex(foundIndex >= 0 ? foundIndex : 0)
    setStarted(true)
  }

  const chooseItem = (label: string) => {
    const list = tab === 'number' ? NUMBER_CURRICULUM : letterCurriculum
    const foundIndex = list.findIndex((item) => item.label === label)
    setIndex(foundIndex >= 0 ? foundIndex : 0)
    setStarted(true)
  }

  const backToTopics = () => {
    setWordTopic(null)
    setWordSubtopic(null)
    setStarted(false)
    setIndex(0)
  }

  const backToSubtopics = () => {
    setWordSubtopic(null)
    setStarted(false)
    setIndex(0)
  }

  const backToWordList = () => setStarted(false)
  const backToItemList = () => setStarted(false)

  // Lets other screens (the level-path node map) deep-link straight past
  // the intro screen into a specific tab/topic via ?tab=&topic=, landing on
  // that item-list screen (not started=true — the list-before-practice gate
  // still applies here same as a normal click-through would).
  useEffect(() => {
    if (isReferencesLoading || tab !== null) return
    const tabParam = searchParams.get('tab')
    if (tabParam === 'number') {
      setTab('number')
    } else if (tabParam === 'letter') {
      setTab('letter')
      setLetterGroup('all')
    } else if (tabParam === 'word') {
      setTab('word')
      const topicParam = searchParams.get('topic')
      if (topicParam) {
        chooseTopic(topicParam)
      } else {
        setWordTopic('all')
        setWordSubtopic('all')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReferencesLoading, searchParams, tab])

  const targets = useMemo(
    () =>
      currentItem
        ? references.filter((r) => r.category === currentItem.category && r.label === currentItem.label)
        : [],
    [references, currentItem],
  )
  const { score, isMatch, hasHand } = useSignMatch(landmarks, targets)

  const hasReference = targets.length > 0
  const isWordTab = tab === 'word'
  const animationSignId =
    isWordTab && hasReference ? (targets.find((t) => !t.id.endsWith('-mirror'))?.id ?? targets[0].id) : undefined

  // Words carry real motion, so a single averaged pose can't verify them —
  // record a short attempt and compare its whole path via DTW instead.
  const referenceSequence = useWordMotionReference(animationSignId)
  const motion = useMotionRecorder(landmarks)
  const [attempt, setAttempt] = useState<{ score: number; isMatch: boolean } | null>(null)

  useEffect(() => {
    setAttempt(null)
    motion.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id])

  const toggleRecording = () => {
    if (motion.isRecording) {
      motion.stop()
      if (motion.sequence.length >= 5 && referenceSequence && referenceSequence.length >= 5) {
        const s = dtwScore(motion.sequence, referenceSequence)
        const matched = s >= DEFAULT_MATCH_THRESHOLD
        setAttempt({ score: s, isMatch: matched })
        if (matched && currentItem) markMastered(currentItem.category, currentItem.label)
      }
    } else {
      setAttempt(null)
      motion.start()
    }
  }

  const staticStatus = !hasHand || !hasReference ? 'idle' : isMatch ? 'correct' : 'incorrect'
  const wordStatus = attempt ? (attempt.isMatch ? 'correct' : 'incorrect') : 'idle'
  const status = isWordTab ? wordStatus : staticStatus

  // Static (지숫자/지문자) matching runs every frame — mark mastered once per
  // item the first time it goes correct, instead of spamming localStorage.
  const masteredRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (isWordTab || !currentItem || !isMatch) return
    const key = `${currentItem.category}:${currentItem.label}`
    if (masteredRef.current.has(key)) return
    masteredRef.current.add(key)
    markMastered(currentItem.category, currentItem.label)
  }, [isWordTab, currentItem, isMatch])

  const [inWordList, setInWordList] = useState(false)
  useEffect(() => {
    setInWordList(isWordTab && !!currentItem ? isInWordList(currentItem.label) : false)
  }, [isWordTab, currentItem])

  const handleToggleWordList = () => {
    if (!currentItem) return
    const { added } = toggleWordListEntry(currentItem.label)
    setInWordList(added)
  }

  const goPrev = () => setIndex((i) => (i - 1 + curriculum.length) % Math.max(curriculum.length, 1))
  const goNext = () => setIndex((i) => (i + 1) % Math.max(curriculum.length, 1))

  if (tab === null) {
    return (
      <IntroGrid>
        {LEARN_TABS.map((t) => (
          <IntroCard key={t.key} onClick={() => switchTab(t.key)}>
            <IntroIcon>
              <PixelGlyph kind={topicGlyphKind(`intro:${t.key}`)} />
            </IntroIcon>
            <IntroLabel>{t.label}</IntroLabel>
          </IntroCard>
        ))}
      </IntroGrid>
    )
  }

  return (
    <>
      <TabBar>
        <BackButton onClick={backToStart}>← 처음으로</BackButton>
        {LEARN_TABS.map((t) => (
          <TabButton key={t.key} $active={tab === t.key} onClick={() => switchTab(t.key)}>
            {t.label}
          </TabButton>
        ))}
      </TabBar>

      {showingWordPicker ? (
        <TopicGrid>
          <TopicCard onClick={() => chooseTopic('all')}>
            <TopicIcon>
              <PixelGlyph kind={topicGlyphKind('전체')} />
            </TopicIcon>
            <div>
              <TopicName>전체 단어</TopicName>
            </div>
          </TopicCard>
          {wordTopics.map((t) => (
            <TopicCard key={t.topic} onClick={() => chooseTopic(t.topic)}>
              <TopicIcon>
                <PixelGlyph kind={topicGlyphKind(t.topic)} />
              </TopicIcon>
              <div>
                <TopicName>{t.topic}</TopicName>
              </div>
            </TopicCard>
          ))}
        </TopicGrid>
      ) : showingSubtopicPicker ? (
        <>
          <BackRow onClick={backToTopics}>
            ← 대분류 변경
            <CurrentTopicLabel>{wordTopic}</CurrentTopicLabel>
          </BackRow>
          <TopicGrid>
            <TopicCard onClick={() => chooseSubtopic('all')}>
              <TopicIcon>
                <PixelGlyph kind={topicGlyphKind(wordTopic ?? '')} />
              </TopicIcon>
              <div>
                <TopicName>전체 {wordTopic}</TopicName>
              </div>
            </TopicCard>
            {wordTopics
              .find((t) => t.topic === wordTopic)
              ?.subtopics.map((s) => (
                <TopicCard key={s.subtopic} onClick={() => chooseSubtopic(s.subtopic)}>
                  <TopicIcon>
                    <PixelGlyph kind={TOPIC_ICON_KIND[s.subtopic] ?? topicGlyphKind(wordTopic ?? '')} />
                  </TopicIcon>
                  <div>
                    <TopicName>{s.subtopic}</TopicName>
                  </div>
                </TopicCard>
              ))}
          </TopicGrid>
        </>
      ) : showingLetterGroupPicker ? (
        <TopicGrid>
          <TopicCard onClick={() => chooseLetterGroup('consonant')}>
            <TopicIcon>
              <PixelGlyph kind="handFist" />
            </TopicIcon>
            <div>
              <TopicName>자음</TopicName>
              <TopicCount>{LETTER_CURRICULUM.filter((i) => i.category === 'consonant').length}개</TopicCount>
            </div>
          </TopicCard>
          <TopicCard onClick={() => chooseLetterGroup('vowel')}>
            <TopicIcon>
              <PixelGlyph kind="handOpen" />
            </TopicIcon>
            <div>
              <TopicName>모음</TopicName>
              <TopicCount>{LETTER_CURRICULUM.filter((i) => i.category === 'vowel').length}개</TopicCount>
            </div>
          </TopicCard>
        </TopicGrid>
      ) : showingItemListPicker ? (
        <>
          {tab === 'letter' && (
            <BackRow onClick={backToLetterGroups}>
              ← 자음/모음 변경
              <CurrentTopicLabel>{letterGroup === 'consonant' ? '자음' : '모음'}</CurrentTopicLabel>
            </BackRow>
          )}
          <WordListGrid>
            {(tab === 'number' ? NUMBER_CURRICULUM : letterCurriculum).map((item) => (
              <WordListChip key={item.id} onClick={() => chooseItem(item.label)}>
                {item.label}
              </WordListChip>
            ))}
          </WordListGrid>
        </>
      ) : showingWordListPicker ? (
        <>
          <BackRow
            onClick={
              wordTopic !== 'all' && (wordTopics.find((t) => t.topic === wordTopic)?.subtopics.length ?? 0) > 1
                ? backToSubtopics
                : backToTopics
            }
          >
            ← 카테고리 변경
            <CurrentTopicLabel>
              {wordTopic === 'all'
                ? '전체 단어'
                : wordSubtopic && wordSubtopic !== 'all' && wordSubtopic !== wordTopic
                  ? `${wordTopic} > ${wordSubtopic}`
                  : wordTopic}
            </CurrentTopicLabel>
          </BackRow>
          <WordListGrid>
            {wordCurriculum.map((item) => (
              <WordListChip key={item.id} onClick={() => chooseWord(item.label)}>
                {item.label}
              </WordListChip>
            ))}
          </WordListGrid>
        </>
      ) : (
        <>
          {tab === 'word' ? (
            <BackRow onClick={backToWordList}>
              ← 단어 목록으로
              <CurrentTopicLabel>
                {wordTopic === 'all'
                  ? '전체 단어'
                  : wordSubtopic && wordSubtopic !== 'all' && wordSubtopic !== wordTopic
                    ? `${wordTopic} > ${wordSubtopic}`
                    : wordTopic}
              </CurrentTopicLabel>
            </BackRow>
          ) : (
            <BackRow onClick={backToItemList}>← 목록으로</BackRow>
          )}

          <WordHeader>
            <WordTitle>"{currentItem?.label ?? '...'}"</WordTitle>
            <WordProgressText>
              {curriculum.length > 0 ? `${index + 1} / ${curriculum.length}` : '0 / 0'}
            </WordProgressText>
          </WordHeader>
          <HeaderProgressTrack>
            <HeaderProgressFill $pct={curriculum.length > 0 ? ((index + 1) / curriculum.length) * 100 : 0} />
          </HeaderProgressTrack>

          <CompareGrid>
            <div>
              <PanelLabel>가이드 영상</PanelLabel>
              {animationSignId ? (
                <SignAnimationPlayer signId={animationSignId} label={currentItem?.label ?? ''} />
              ) : hasReference && targets[0] ? (
                <StaticHandGuide vector={targets[0].vector} label={currentItem?.label ?? ''} />
              ) : (
                <Card>
                  <p style={{ color: '#6B7290', fontSize: 13 }}>
                    {isReferencesLoading
                      ? '수어 레퍼런스 데이터를 불러오는 중입니다...'
                      : currentItem
                        ? `"${currentItem.label}" 레퍼런스가 아직 없습니다. /dev/capture 에서 ID "${curriculumId(currentItem.category, currentItem.label)}"로 녹화해 추가하세요.`
                        : ''}
                  </p>
                </Card>
              )}
            </div>

            <div>
              <PanelLabel>내 카메라</PanelLabel>
              <CameraBox $status={isActive ? status : 'idle'}>
                {isActive && <LiveBadge>● LIVE</LiveBadge>}
                {isActive && (
                  <ModelBadge>
                    {isModelLoading
                      ? '모델 로딩 중...'
                      : modelError
                        ? modelError
                        : landmarks.length > 0
                          ? `손 ${landmarks.length}개 인식됨 (${handedness.join(', ')})`
                          : '손을 카메라에 보여주세요'}
                  </ModelBadge>
                )}
                {isActive && !isModelLoading && (
                  <ScoreBadge $status={status}>
                    {isWordTab
                      ? !hasReference
                        ? '레퍼런스 없음'
                        : motion.isRecording
                          ? `녹화 중... (${motion.sequence.length}프레임)`
                          : attempt
                            ? `일치도 ${attempt.score}%`
                            : '녹화 버튼을 눌러 시작'
                      : !hasReference
                        ? '레퍼런스 없음'
                        : !hasHand
                          ? '대기 중'
                          : `일치도 ${score}%`}
                  </ScoreBadge>
                )}
                <Video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isActive ? 'block' : 'none' }}
                />
                <LandmarkCanvas ref={canvasRef} />
                {!isActive && <Placeholder>{error ?? '카메라를 시작해 학습을 시작하세요'}</Placeholder>}
              </CameraBox>
            </div>
          </CompareGrid>

          <Card>
            <HintList>
              <li>손이 카메라 중앙에 오도록 위치를 맞추세요</li>
              {isWordTab ? (
                <>
                  <li>가이드 영상으로 동작을 먼저 확인하세요</li>
                  <li>"동작 녹화 시작"을 누르고 그 동작을 그대로 따라 한 뒤 다시 눌러 채점하세요</li>
                </>
              ) : (
                <li>가이드를 천천히 따라 하며 일치도를 확인하세요</li>
              )}
            </HintList>
            <NavRow>
              <Button onClick={start} disabled={isActive} style={{ flex: 1 }}>
                {isActive ? '학습 중...' : '시작하기'}
              </Button>
              {isWordTab && isActive && (
                <Button
                  $variant={motion.isRecording ? 'accent' : 'secondary'}
                  onClick={toggleRecording}
                  disabled={!hasReference}
                  style={{ flex: 1 }}
                >
                  {motion.isRecording ? `녹화 중지 & 채점 (${motion.sequence.length})` : '동작 녹화 시작'}
                </Button>
              )}
            </NavRow>
            {isWordTab && currentItem && (
              <NavRow>
                <Button $variant={inWordList ? 'accent' : 'secondary'} style={{ flex: 1 }} onClick={handleToggleWordList}>
                  {inWordList ? '★ 내 단어장에 있음' : '☆ 내 단어장에 추가'}
                </Button>
              </NavRow>
            )}
            <NavRow style={{ marginBottom: 0 }}>
              <Button $variant="secondary" style={{ flex: 1 }} onClick={goPrev}>
                ← 이전
              </Button>
              <Button style={{ flex: 2 }} onClick={goNext}>
                넘어가기 →
              </Button>
            </NavRow>
          </Card>
        </>
      )}
    </>
  )
}

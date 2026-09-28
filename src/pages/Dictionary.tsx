import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Card } from '../components/ui/Card'
import { SignAnimationPlayer } from '../components/learn/SignAnimationPlayer'
import { useSignReferences } from '../hooks/useSignReferences'

const TOPIC_ICONS: Record<string, string> = {
  전체: '📚',
  '기관·장소': '🏢',
  '가족·관계': '👪',
  '사람·직업': '👤',
  음식: '🍚',
  '동물·자연': '🌿',
  '색깔·외형': '🎨',
  '감정·상태': '😊',
  '시간·날짜': '🕒',
  '학교·교육': '🎓',
  '복지·장애': '🤝',
  '사회·법률·행정': '⚖️',
  '사물·생활': '🧺',
  '동작·묘사': '🏃',
  기타: '🗂️',
}

const MAX_RESULTS = 60

const Title = styled.h1`
  font-size: 18px;
  margin: 0 0 6px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const Subtitle = styled.p`
  margin: 0 0 24px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const SearchInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 16px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 15px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
`

const Chip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 9.5px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
`

const ResultsMeta = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 12px;
`

const ResultsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
`

const WordChip = styled.button<{ $active: boolean }>`
  padding: 9px 14px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 14px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.surface)};
  color: ${({ theme, $active }) => ($active ? '#fff' : theme.colors.text)};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
`

const PreviewHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
`

const PreviewWord = styled.h2`
  font-size: 22px;
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const PreviewTopic = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Placeholder = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
`

export default function Dictionary() {
  const { references, isLoading } = useSignReferences()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)

  const wordRefs = useMemo(() => references.filter((r) => r.category === 'word'), [references])

  const labelTopic = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of wordRefs) {
      if (!map.has(r.label)) map.set(r.label, r.topic ?? '기타')
    }
    return map
  }, [wordRefs])

  const topics = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of labelTopic.values()) counts.set(t, (counts.get(t) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([t, count]) => ({ topic: t, count }))
      .sort((a, b) => b.count - a.count)
  }, [labelTopic])

  const allLabels = useMemo(
    () => Array.from(labelTopic.keys()).sort((a, b) => a.localeCompare(b, 'ko')),
    [labelTopic],
  )

  const filtered = useMemo(() => {
    const q = query.trim()
    return allLabels.filter((label) => {
      if (topic !== 'all' && labelTopic.get(label) !== topic) return false
      if (q && !label.includes(q)) return false
      return true
    })
  }, [allLabels, labelTopic, topic, query])

  const visible = filtered.slice(0, MAX_RESULTS)

  const selectedTargets = useMemo(
    () => (selected ? wordRefs.filter((r) => r.label === selected) : []),
    [wordRefs, selected],
  )
  const selectedSignId =
    selectedTargets.find((t) => !t.id.endsWith('-mirror'))?.id ?? selectedTargets[0]?.id

  return (
    <>
      <Title>수어 사전</Title>
      <Subtitle>로그인 없이도 궁금한 단어를 검색해서 수어 동작을 바로 확인할 수 있어요.</Subtitle>

      <SearchInput
        type="text"
        placeholder="단어를 입력하세요 (예: 가족, 감사)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <ChipRow>
        <Chip $active={topic === 'all'} onClick={() => setTopic('all')}>
          {TOPIC_ICONS['전체']} 전체
        </Chip>
        {topics.map((t) => (
          <Chip key={t.topic} $active={topic === t.topic} onClick={() => setTopic(t.topic)}>
            {TOPIC_ICONS[t.topic] ?? '🗂️'} {t.topic} {t.count}
          </Chip>
        ))}
      </ChipRow>

      {isLoading ? (
        <Placeholder>단어 데이터를 불러오는 중...</Placeholder>
      ) : filtered.length === 0 ? (
        <Placeholder>&ldquo;{query}&rdquo;에 해당하는 단어를 찾지 못했어요.</Placeholder>
      ) : (
        <>
          <ResultsMeta>
            {filtered.length}개 검색됨
            {filtered.length > MAX_RESULTS ? ` (상위 ${MAX_RESULTS}개 표시, 검색어를 좁혀보세요)` : ''}
          </ResultsMeta>
          <ResultsGrid>
            {visible.map((label) => (
              <WordChip key={label} $active={selected === label} onClick={() => setSelected(label)}>
                {label}
              </WordChip>
            ))}
          </ResultsGrid>
        </>
      )}

      {selected && selectedSignId && (
        <Card>
          <PreviewHead>
            <PreviewWord>{selected}</PreviewWord>
            <PreviewTopic>
              {TOPIC_ICONS[labelTopic.get(selected) ?? '기타']} {labelTopic.get(selected)}
            </PreviewTopic>
          </PreviewHead>
          <SignAnimationPlayer signId={selectedSignId} label={selected} />
        </Card>
      )}
    </>
  )
}

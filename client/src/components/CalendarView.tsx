import React, { useState, useMemo } from 'react';
import { Task, CalendarEvent } from '../types';
import { api } from '../api';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  CircleDot,
  Circle,
  X,
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  onTaskClick: (task: Task) => void;
  onEventCreated: (evt: CalendarEvent) => void;
  onEventDeleted: (id: string) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const EVENT_COLORS: Record<
  CalendarEvent['color'],
  { label: string; dot: string; pill: string; border: string }
> = {
  purple: {
    label: 'Roxo',
    dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    pill: 'bg-purple-950/60 text-purple-200 border-purple-500/40',
    border: 'border-purple-500/35',
  },
  violet: {
    label: 'Violeta',
    dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
    pill: 'bg-indigo-950/60 text-indigo-200 border-indigo-500/40',
    border: 'border-indigo-500/35',
  },
  emerald: {
    label: 'Verde',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    pill: 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40',
    border: 'border-emerald-500/35',
  },
  amber: {
    label: 'Âmbar',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    pill: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
    border: 'border-amber-500/35',
  },
  rose: {
    label: 'Rosa',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    pill: 'bg-rose-950/60 text-rose-200 border-rose-500/40',
    border: 'border-rose-500/35',
  },
};

function toDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  events,
  onTaskClick,
  onEventCreated,
  onEventDeleted,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(
    () => toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Estado do formulário para marcar nova data
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [title, setTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<CalendarEvent['color']>('purple');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mapear tarefas e eventos por data (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = e.event_date.slice(0, 10);
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  // Gerar células do mês atual
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      day: number;
      dateKey: string;
      isCurrentMonth: boolean;
    }> = [];

    // Dias finais do mês anterior
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      cells.push({
        day: d,
        dateKey: toDateKey(prevYear, prevMonth, d),
        isCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateKey: toDateKey(currentYear, currentMonth, d),
        isCurrentMonth: true,
      });
    }

    // Completar múltiplo de 7 (35 ou 42 células)
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const totalNeeded = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalNeeded) {
      cells.push({
        day: nextDay,
        dateKey: toDateKey(nextYear, nextMonth, nextDay),
        isCurrentMonth: false,
      });
      nextDay++;
    }

    return cells;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.createCalendarEvent({
        title: title.trim(),
        description: description.trim(),
        event_date: selectedDateKey,
        event_time: eventTime.trim() || null,
        color,
      });
      onEventCreated(res.event);
      setTitle('');
      setEventTime('');
      setDescription('');
      setIsAddingEvent(false);
    } catch (err) {
      console.error('Erro ao marcar data:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDayTasks = tasksByDate.get(selectedDateKey) || [];
  const selectedDayEvents = eventsByDate.get(selectedDateKey) || [];

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    if (!y || !m || !d) return selectedDateKey;
    return `${d} de ${MONTHS[m - 1]}, ${y}`;
  }, [selectedDateKey]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-12 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Coluna Esquerda: Grade do Calendário Mensal */}
        <div className="lg:col-span-8 relative rounded-3xl bg-[#0d0d14]/90 backdrop-blur-2xl border border-purple-500/20 shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-4 sm:p-6 overflow-hidden">
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

          {/* Header do Mês */}
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.8)]" />
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-[0.16em] text-white">
                {MONTHS[currentMonth]}{' '}
                <span className="text-purple-400 font-mono">{currentYear}</span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-xl bg-[#14141f] hover:bg-purple-500/15 border border-purple-500/25 text-[11px] font-semibold text-purple-200 transition-all active:scale-95"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-[#14141f] hover:bg-purple-500/15 border border-white/[0.06] hover:border-purple-500/30 text-zinc-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-[#14141f] hover:bg-purple-500/15 border border-white/[0.06] hover:border-purple-500/30 text-zinc-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS.map(day => (
              <div
                key={day}
                className="text-center py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grade dos Dias */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map(cell => {
              const dayTasks = tasksByDate.get(cell.dateKey) || [];
              const dayEvents = eventsByDate.get(cell.dateKey) || [];
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === todayKey;
              const totalItems = dayTasks.length + dayEvents.length;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`group relative min-h-[60px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-900/25 border-purple-500 shadow-[0_0_22px_rgba(124,58,237,0.3)]'
                      : isToday
                      ? 'bg-[#141224] border-purple-500/40'
                      : cell.isCurrentMonth
                      ? 'bg-[#11111a]/90 border-white/[0.05] hover:border-purple-500/35 hover:bg-[#151522]'
                      : 'bg-[#0a0a10]/50 border-white/[0.02] opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Topo da Célula: Número do Dia */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.8)]'
                          : isToday
                          ? 'text-purple-300 border border-purple-500/50 bg-purple-500/10'
                          : cell.isCurrentMonth
                          ? 'text-zinc-200 group-hover:text-white'
                          : 'text-zinc-600'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {totalItems > 0 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        {totalItems}
                      </span>
                    )}
                  </div>

                  {/* Indicadores Mobile (Dots) */}
                  <div className="flex sm:hidden items-center gap-1 flex-wrap mt-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rotate-45 rounded-[1px] ${
                          EVENT_COLORS[ev.color]?.dot || EVENT_COLORS.purple.dot
                        }`}
                      />
                    ))}
                    {dayTasks.slice(0, 3).map(t => (
                      <span
                        key={t.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.status === 'done'
                            ? 'bg-emerald-400'
                            : t.status === 'doing'
                            ? 'bg-violet-400'
                            : 'bg-purple-400'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Pílulas Desktop */}
                  <div className="hidden sm:flex flex-col gap-1 w-full mt-1.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        className={`px-1.5 py-0.5 rounded-md border text-[9px] font-medium truncate flex items-center gap-1 ${
                          EVENT_COLORS[ev.color]?.pill || EVENT_COLORS.purple.pill
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rotate-45 bg-current shrink-0" />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}

                    {dayTasks.slice(0, 2 - Math.min(dayEvents.length, 1)).map(t => (
                      <div
                        key={t.id}
                        className={`px-1.5 py-0.5 rounded-md border text-[9px] font-medium truncate flex items-center gap-1 ${
                          t.status === 'done'
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 line-through opacity-75'
                            : t.status === 'doing'
                            ? 'bg-violet-950/50 border-violet-500/35 text-violet-200'
                            : 'bg-[#19162b] border-purple-500/30 text-zinc-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            t.status === 'done'
                              ? 'bg-emerald-400'
                              : t.status === 'doing'
                              ? 'bg-violet-400'
                              : 'bg-purple-400'
                          }`}
                        />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}

                    {totalItems > 2 && (
                      <span className="text-[9px] font-mono text-zinc-500 pl-1">
                        +{totalItems - 2} mais
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Agenda do Dia Selecionado + Marcar Nova Data */}
        <div className="lg:col-span-4 relative rounded-3xl bg-[#0d0d14]/90 backdrop-blur-2xl border border-purple-500/20 shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-5 sm:p-6 overflow-hidden">
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

          {/* Cabeçalho do Dia Selecionado */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">
                  Data Selecionada
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {formattedSelectedDate}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingEvent(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isAddingEvent
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white shadow-[0_4px_18px_rgba(109,40,217,0.4)]'
              }`}
            >
              {isAddingEvent ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Fechar</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Marcar Data</span>
                </>
              )}
            </button>
          </div>

          {/* Formulário para Marcar Nova Data no Calendário (independente de Task) */}
          {isAddingEvent && (
            <form
              onSubmit={handleCreateEvent}
              className="mt-4 p-4 rounded-2xl bg-[#13131f] border border-purple-500/30 space-y-3.5 animate-fade-up"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Título na Agenda
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Reunião, Campeonato, Marco..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b12] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs text-white placeholder-zinc-600"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Horário (Opcional)
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0b12] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs text-white [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Cor
                  </label>
                  <div className="flex items-center gap-1.5 h-[38px] sm:h-[34px] px-2 rounded-xl bg-[#0b0b12] border border-white/[0.08]">
                    {(Object.keys(EVENT_COLORS) as Array<CalendarEvent['color']>).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        title={EVENT_COLORS[c].label}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-white/60' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${EVENT_COLORS[c].dot}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Observação (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalhes desta data..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0b0b12] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs text-white placeholder-zinc-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_18px_rgba(109,40,217,0.4)] active:scale-95"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar no Calendário'}
              </button>
            </form>
          )}

          {/* Lista de Itens do Dia: Datas Marcadas + Tarefas */}
          <div className="mt-4 space-y-4">
            {/* Seção 1: Datas Marcadas no Calendário */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Datas Marcadas ({selectedDayEvents.length})
                </span>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-[#11111a]/60 border border-white/[0.04] text-center text-[11px] text-zinc-500">
                  Nenhuma marcação extra neste dia.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map(ev => {
                    const style = EVENT_COLORS[ev.color] || EVENT_COLORS.purple;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-2xl bg-[#13131d] border ${style.border} flex items-start justify-between gap-3 transition-all`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rotate-45 rounded-[2px] mt-1 shrink-0 ${style.dot}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">{ev.title}</span>
                              {ev.event_time && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 border border-white/[0.08] text-[10px] font-mono text-purple-300">
                                  <Clock className="w-2.5 h-2.5" />
                                  {ev.event_time}
                                </span>
                              )}
                            </div>
                            {ev.description && (
                              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed break-words">
                                {ev.description}
                              </p>
                            )}
                            {ev.creator_name && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <img
                                  src={
                                    ev.creator_avatar ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${ev.creator_name}&backgroundColor=7c3aed`
                                  }
                                  alt={ev.creator_name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-[10px] text-zinc-500">
                                  Marcado por {ev.creator_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.deleteCalendarEvent(ev.id);
                              onEventDeleted(ev.id);
                            } catch {}
                          }}
                          title="Remover data"
                          className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção 2: Tarefas com Entrega no Dia */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Tarefas do Dia ({selectedDayTasks.length})
                </span>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-[#11111a]/60 border border-white/[0.04] text-center text-[11px] text-zinc-500">
                  Nenhuma tarefa com vencimento neste dia.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="group p-3.5 rounded-2xl bg-[#13131d] hover:bg-[#181826] border border-white/[0.07] hover:border-purple-500/40 cursor-pointer transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : task.status === 'doing' ? (
                          <CircleDot className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        )}

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              task.status === 'done'
                                ? 'text-zinc-400 line-through'
                                : 'text-white group-hover:text-purple-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.assigned_name && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <img
                                src={
                                  task.assigned_avatar ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${task.assigned_name}&backgroundColor=7c3aed`
                                }
                                alt={task.assigned_name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="text-[10px] text-zinc-400">
                                {task.assigned_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          task.status === 'done'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : task.status === 'doing'
                            ? 'bg-violet-950/60 text-violet-300 border border-violet-500/30'
                            : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {task.status === 'done'
                          ? 'Completo'
                          : task.status === 'doing'
                          ? 'Fazendo'
                          : 'A Fazer'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


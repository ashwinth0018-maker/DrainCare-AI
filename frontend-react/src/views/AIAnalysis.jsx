import { useEffect, useState, useCallback } from 'react'
import { Brain, Droplets, Thermometer, Wind, MapPin, Cpu, Shield as ShieldAlert, Lightbulb, ChevronRight, Loader as Loader2, Activity } from 'lucide-react'
import StatusBadge from '../components/StatusBadge.jsx'
import { LoadingState, ErrorState, EmptyState } from '../components/States.jsx'
import { api } from '../api.js'
import { formatDateTime, riskLevelColor, riskScoreColor, riskBarColor } from '../utils.js'

export default function AIAnalysis({ preselectedId, onSimulation }) {
  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(preselectedId || null)
  const [analysis, setAnalysis] = useState(null)
  const [loadingReadings, setLoadingReadings] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)

  const loadReadings = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getReadings()
      setReadings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingReadings(false)
    }
  }, [])

  useEffect(() => {
    loadReadings()
  }, [loadReadings])

  useEffect(() => {
    if (preselectedId) {
      setSelectedId(preselectedId)
      runAnalysis(preselectedId)
    }
  }, [preselectedId])

  const runAnalysis = async (id) => {
    setSelectedId(id)
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const result = await api.analyzeReading(id)
      setAnalysis(result)
    } catch (err) {
      setAnalysisError(err.message)
      setAnalysis(null)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loadingReadings) {
    return (
      <div className="card p-6">
        <LoadingState message="Loading readings..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <ErrorState message={error} onRetry={loadReadings} />
      </div>
    )
  }

  const selectedReading = readings.find((r) => r.id === selectedId)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-white">AI Risk Analysis</h2>
        <p className="text-sm text-slate-500 mt-1">
          Select a reading to get an AI-powered drainage risk assessment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Reading selector */}
        <div className="lg:col-span-2 card p-4 max-h-[600px] flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
            Select Reading
          </h3>
          {readings.length === 0 ? (
            <EmptyState icon={Activity} message="No readings available." />
          ) : (
            <div className="overflow-y-auto space-y-1 flex-1">
              {readings.slice(0, 50).map((r) => (
                <button
                  key={r.id}
                  onClick={() => runAnalysis(r.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 border
                    ${
                      selectedId === r.id
                        ? 'bg-teal-700/15 border-teal-600/40'
                        : 'bg-navy-950/30 border-navy-800/30 hover:bg-navy-800/40 hover:border-navy-700/50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">
                      #{r.id} · {r.sensor_id}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-slate-500 truncate">{r.location}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {formatDateTime(r.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Analysis result */}
        <div className="lg:col-span-3">
          {!selectedId && !analyzing && (
            <div className="card p-6">
              <EmptyState
                icon={Brain}
                message="Select a sensor reading from the left to view its AI risk analysis."
              />
            </div>
          )}

          {analyzing && (
            <div className="card p-6">
              <LoadingState message="Running AI risk analysis..." />
            </div>
          )}

          {analysisError && !analyzing && (
            <div className="card p-6">
              <ErrorState message={analysisError} onRetry={() => selectedId && runAnalysis(selectedId)} />
            </div>
          )}

          {analysis && !analyzing && (
            <AnalysisResult result={analysis} reading={selectedReading} />
          )}
        </div>
      </div>
    </div>
  )
}

function AnalysisResult({ result, reading }) {
  const a = result.ai_analysis

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Reading context */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-teal-700/15 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Reading #{result.reading_id}
            </h3>
            <p className="text-xs text-slate-500">{result.sensor_id}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={result.sensor_status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MetricMini icon={Droplets} label="Water" value={reading?.water_level ?? '—'} unit="%" color="text-blue-400" />
          <MetricMini icon={Thermometer} label="Temp" value={reading?.temperature ?? '—'} unit="°C" color="text-amber-400" />
          <MetricMini icon={Wind} label="Gas" value={reading?.gas_level ?? '—'} unit="ppm" color="text-red-400" />
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-navy-800/50">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">{result.location}</span>
        </div>
      </div>

      {/* Risk score */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Risk Assessment</h3>
        </div>

        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Risk Score</p>
            <p className={`text-4xl font-bold ${riskScoreColor(a.risk_score)}`}>
              {a.risk_score}
              <span className="text-lg text-slate-600 font-normal">/100</span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500 mb-1">Risk Level</p>
            <p className={`text-xl font-bold ${riskLevelColor(a.risk_level)}`}>
              {a.risk_level}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-navy-950/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${riskBarColor(a.risk_score)} rounded-full transition-all duration-500`}
            style={{ width: `${a.risk_score}%` }}
          />
        </div>
      </div>

      {/* Risk reasons */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Risk Factors</h3>
        <ul className="space-y-2">
          {a.reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <ChevronRight className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendation */}
      <div className="card p-5 border-l-2 border-l-teal-600/50">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700/15 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Recommendation</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{a.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricMini({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-950/40">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-bold ${color}`}>
          {value}
          <span className="text-xs text-slate-600 font-normal ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  )
}

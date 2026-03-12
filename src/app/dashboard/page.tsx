import { 
  GitPullRequest, 
  GitMerge, 
  GitCommit,
  AlertCircle, 
  Clock, 
  Activity,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const metrics = [
    { label: 'PRs abertos', value: '12', icon: GitPullRequest, trend: '+2', trendType: 'up' },
    { label: 'Aguardando revisão', value: '5', icon: Clock, trend: '-1', trendType: 'down' },
    { label: 'Issues em andamento', value: '23', icon: AlertCircle, trend: 'estável', trendType: 'neutral' },
    { label: 'Deploys (7d)', value: '14', icon: Activity, trend: '+15%', trendType: 'up' },
  ];

  const activities = [
    { type: 'commit', repo: 'backend', icon: GitCommit, message: 'fix: corrige validação de auth v2', author: 'João', time: '2h atrás', colorClass: styles.iconCommit },
    { type: 'pr_merged', repo: 'frontend', icon: GitMerge, message: 'feat: adiciona componente kanban e tokens', author: 'Maria', time: '5h atrás', colorClass: styles.iconMerge },
    { type: 'commit', repo: 'mobile-app', icon: GitCommit, message: 'refactor: atualiza dependências do react-native', author: 'Carlos', time: '1 dia atrás', colorClass: styles.iconCommit },
  ];

  return (
    <div>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </header>

      <section className={styles.metricsGrid}>
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>{metric.label}</span>
                <Icon className={styles.metricIcon} size={20} />
              </div>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={`${styles.metricTrend} ${
                metric.trendType === 'up' ? styles.trendUp : 
                metric.trendType === 'down' ? styles.trendDown : styles.trendNeutral
              }`}>
                {metric.trendType === 'up' ? <ArrowUpRight size={14} /> : 
                 metric.trendType === 'down' ? <TrendingDown size={14} /> : null}
                {metric.trend} em relação à semana passada
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <Activity size={20} className={styles.metricIcon} />
            Atividade Recente
          </h2>
          <div className={styles.feedList}>
            {activities.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={styles.feedItem}>
                  <div className={`${styles.feedIconWrapper} ${item.colorClass}`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </div>
                  <div className={styles.feedContent}>
                    <div className={styles.feedMeta}>
                      <span className={styles.repoTag}>{item.repo}</span>
                      <span className={styles.feedTime}>{item.time}</span>
                    </div>
                    <div className={styles.feedMessage}>{item.message}</div>
                    <div className={styles.feedAuthor}>por {item.author}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            Próximos Marcos
          </h2>
          <div className={styles.releaseList}>
            <div className={styles.releaseItem}>
              <div className={styles.releaseHeader}>
                <span className={styles.releaseName}>Release v2.0</span>
                <span className={styles.releaseDate}>30/04/2026</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className={styles.releaseItem}>
              <div className={styles.releaseHeader}>
                <span className={styles.releaseName}>Sprint 12</span>
                <span className={styles.releaseDate}>15/04/2026</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

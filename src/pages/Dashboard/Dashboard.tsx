import { Link } from 'react-router-dom';
import { Calendar, CheckSquare, Package, Sprout, AlertTriangle, ChevronRight, Leaf } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate, formatDisplayDateShort, parseMMDD, getTaskIcon } from '../../utils/dateCalculations';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? 'Gardener';
  const {
    settings,
    plantings,
    tasks,
    inventory,
    getUpcomingTasks,
    getOverdueTasks,
  } = useGardenStore();

  const today = new Date();
  const { lastSpringFrost, firstFallFrost, zone } = settings.location;
  const lastFrostDisplay = formatDisplayDate(parseMMDD(lastSpringFrost, today.getFullYear()));
  const firstFrostDisplay = formatDisplayDate(parseMMDD(firstFallFrost, today.getFullYear()));

  const upcomingTasks = getUpcomingTasks(14);
  const overdueTasks = getOverdueTasks();
  const completedTasks = tasks.filter((t) => t.completed);
  const lowInventory = inventory.filter((i) => i.status === 'low' || i.status === 'empty');

  const daysToLastFrost = Math.round(
    (parseMMDD(lastSpringFrost, today.getFullYear()).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stats = [
    { label: 'Plants Scheduled', value: plantings.length, icon: '🌱', href: '/plantings' },
    { label: 'Tasks This Week', value: getUpcomingTasks(7).length, icon: '✅', href: '/tasks' },
    { label: 'Seed Varieties', value: inventory.length, icon: '📦', href: '/inventory' },
    { label: 'Completed Tasks', value: completedTasks.length, icon: '🎯', href: '/tasks' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {getGreeting()}, {firstName}! 🌿
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(today, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Link to="/seeds" className="btn-primary text-sm">
            <Sprout size={16} /> Add Plant
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Frost Date Banner */}
        <div className="bg-gradient-to-r from-garden-600 to-garden-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-garden-100 text-sm font-medium mb-1">
                {zone ? `USDA Zone ${zone}` : 'Your Garden'} — Frost Dates
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <div className="text-xs text-garden-200">Last Spring Frost</div>
                  <div className="text-lg font-bold">{lastFrostDisplay}</div>
                </div>
                <div>
                  <div className="text-xs text-garden-200">First Fall Frost</div>
                  <div className="text-lg font-bold">{firstFrostDisplay}</div>
                </div>
              </div>
            </div>
            <div className="text-center">
              {daysToLastFrost > 0 ? (
                <>
                  <div className="text-3xl font-bold">{daysToLastFrost}</div>
                  <div className="text-garden-200 text-sm">days to last frost</div>
                </>
              ) : Math.abs(daysToLastFrost) < 180 ? (
                <>
                  <div className="text-3xl font-bold">{Math.abs(daysToLastFrost)}</div>
                  <div className="text-garden-200 text-sm">days past last frost</div>
                </>
              ) : (
                <div className="text-garden-200 text-sm">Frost-free season</div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.href}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={18} />
                  <h2 className="font-semibold text-gray-900">Overdue Tasks</h2>
                  <span className="badge bg-red-100 text-red-700">{overdueTasks.length}</span>
                </div>
                <Link to="/tasks" className="text-sm text-garden-600 hover:text-garden-700 font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {overdueTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                    <span className="text-base flex-shrink-0">{getTaskIcon(task.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.label}</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Was due {formatDisplayDateShort(task.dueDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-garden-600" size={18} />
                <h2 className="font-semibold text-gray-900">Upcoming (next 14 days)</h2>
                <span className="badge bg-garden-100 text-garden-700">{upcomingTasks.length}</span>
              </div>
              <Link to="/tasks" className="text-sm text-garden-600 hover:text-garden-700 font-medium">
                View all
              </Link>
            </div>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                    <span className="text-base flex-shrink-0">{getTaskIcon(task.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDisplayDateShort(task.dueDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckSquare className="mx-auto mb-2 opacity-30" size={32} />
                <p className="text-sm">No upcoming tasks</p>
                <Link to="/seeds" className="text-sm text-garden-600 hover:underline mt-1 block">
                  Add plants to your calendar
                </Link>
              </div>
            )}
          </div>

          {/* Recent Plantings */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Leaf className="text-garden-600" size={18} />
                <h2 className="font-semibold text-gray-900">My Plants</h2>
              </div>
              <Link to="/calendar" className="text-sm text-garden-600 hover:text-garden-700 font-medium flex items-center gap-1">
                View calendar <ChevronRight size={14} />
              </Link>
            </div>
            {plantings.length > 0 ? (
              <div className="space-y-2">
                {plantings.slice(0, 6).map((planting) => (
                  <div
                    key={planting.id}
                    className="flex items-center gap-3 p-2.5 hover:bg-stone-50 rounded-xl"
                  >
                    <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', planting.color)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {planting.varietyName || planting.seedName}
                        {planting.successionIndex !== undefined && (
                          <span className="text-gray-400 ml-1 text-xs">#{planting.successionIndex + 1}</span>
                        )}
                      </p>
                      {planting.varietyName && (
                        <p className="text-xs text-gray-400 truncate">{planting.seedName}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {planting.transplantDate
                          ? `Transplant: ${formatDisplayDateShort(planting.transplantDate)}`
                          : planting.directSowDate
                          ? `Direct sow: ${formatDisplayDateShort(planting.directSowDate)}`
                          : planting.indoorStartDate
                          ? `Start indoors: ${formatDisplayDateShort(planting.indoorStartDate)}`
                          : 'Scheduled'}
                      </p>
                    </div>
                  </div>
                ))}
                {plantings.length > 6 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    +{plantings.length - 6} more plants
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Leaf className="mx-auto mb-2 opacity-30" size={32} />
                <p className="text-sm">No plants scheduled yet</p>
                <Link to="/seeds" className="text-sm text-garden-600 hover:underline mt-1 block">
                  Browse seed database
                </Link>
              </div>
            )}
          </div>

          {/* Inventory Alerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="text-garden-600" size={18} />
                <h2 className="font-semibold text-gray-900">Seed Inventory</h2>
              </div>
              <Link to="/inventory" className="text-sm text-garden-600 hover:text-garden-700 font-medium flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {inventory.length > 0 ? (
              <div className="space-y-3">
                {lowInventory.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-medium text-amber-800">
                      ⚠️ {lowInventory.length} item{lowInventory.length !== 1 ? 's' : ''} running low
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {lowInventory.map((i) => i.varietyName).join(', ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{inventory.length}</span> seed varieties tracked
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inventory.filter((i) => i.status === 'available').length} available,{' '}
                    {inventory.filter((i) => i.status === 'empty').length} empty
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="mx-auto mb-2 opacity-30" size={32} />
                <p className="text-sm">No seeds in inventory</p>
                <Link to="/inventory" className="text-sm text-garden-600 hover:underline mt-1 block">
                  Add your seed collection
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/tools', icon: '🔍', label: 'What can I plant?', desc: 'Based on today\'s date' },
              { href: '/seeds', icon: '🌱', label: 'Add to calendar', desc: 'Plan new crops' },
              { href: '/journal', icon: '📝', label: 'New journal entry', desc: 'Log today\'s garden' },
              { href: '/inventory', icon: '📦', label: 'Track seeds', desc: 'Manage your collection' },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center text-center p-4 bg-stone-50 hover:bg-garden-50 rounded-xl transition-colors group"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-sm font-medium text-gray-900 group-hover:text-garden-700">
                  {item.label}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

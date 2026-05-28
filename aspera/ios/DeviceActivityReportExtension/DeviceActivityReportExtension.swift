import DeviceActivity
import ExtensionKit
import Foundation
import SwiftUI

private enum ReportConstants {
  static let appGroupId = "group.com.dominicross.aspera"
  static let dailyTotalsKey = "dailyTotals"

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }
}

extension DeviceActivityReport.Context {
  static let asperaDailyTotals = Self("Aspera Daily Totals")
}

@main
struct AsperaDeviceActivityReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    ScreenTimeDailyTotalsReport { days in
      ScreenTimeDailyTotalsView(days: days)
    }
  }
}

struct ScreenTimeDailyTotalsReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .asperaDailyTotals
  let content: ([ScreenTimeReportDay]) -> ScreenTimeDailyTotalsView

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> [ScreenTimeReportDay] {
    var byDate: [String: [String: Int]] = [:]

    for await deviceData in data {
      for await segment in deviceData.activitySegments {
        let date = dayKey(segment.dateInterval.start)
        var categories = byDate[date] ?? emptyCategories()

        for await categoryActivity in segment.categories {
          let category = mapCategory(categoryActivity.category.localizedDisplayName)
          let minutes = max(0, Int((categoryActivity.totalActivityDuration / 60).rounded()))
          categories[category, default: 0] += minutes
        }

        byDate[date] = categories
      }
    }

    let days = byDate.keys.sorted().map { date in
      let categories = byDate[date] ?? emptyCategories()
      let total = categories.values.reduce(0, +)
      return ScreenTimeReportDay(
        date: date,
        byCategory: categories,
        totalMinutes: total
      )
    }

    writeDailyTotals(days)
    return days
  }
}

struct ScreenTimeReportDay: Codable, Hashable, Identifiable {
  let date: String
  let byCategory: [String: Int]
  let totalMinutes: Int

  var id: String { date }
}

struct ScreenTimeDailyTotalsView: View {
  let days: [ScreenTimeReportDay]

  var body: some View {
    VStack(spacing: 12) {
      if let latest = days.last {
        Text("Synced \(days.filter { $0.totalMinutes > 0 }.count) / 7 days")
          .font(.headline)
        Text("\(formatMinutes(latest.totalMinutes)) today")
          .font(.title3.weight(.semibold))
        VStack(alignment: .leading, spacing: 6) {
          ForEach(categoryRows(latest)) { row in
            HStack {
              Text(row.label)
              Spacer()
              Text(formatMinutes(row.minutes))
                .foregroundStyle(.secondary)
            }
            .font(.footnote)
          }
        }
        .padding(.horizontal)
      } else {
        Text("No Screen Time totals yet")
          .font(.headline)
        Text("Open this report after the device has Screen Time history.")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
    }
    .padding()
  }
}

private func emptyCategories() -> [String: Int] {
  [
    "social": 0,
    "entertainment": 0,
    "productivity": 0,
    "communication": 0,
    "other": 0,
  ]
}

private func mapCategory(_ displayName: String?) -> String {
  guard let displayName else { return "other" }
  let name = displayName.lowercased()

  if name.contains("communication") || name.contains("messages") {
    return "communication"
  }
  if name.contains("social") {
    return "social"
  }
  if name.contains("entertainment") || name.contains("game") ||
    name.contains("music") || name.contains("video") {
    return "entertainment"
  }
  if name.contains("productivity") || name.contains("finance") ||
    name.contains("education") || name.contains("business") {
    return "productivity"
  }
  return "other"
}

private func dayKey(_ date: Date) -> String {
  let formatter = DateFormatter()
  formatter.calendar = Calendar(identifier: .gregorian)
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter.string(from: date)
}

private func writeDailyTotals(_ days: [ScreenTimeReportDay]) {
  guard
    let data = try? JSONEncoder().encode(days),
    let json = String(data: data, encoding: .utf8)
  else {
    return
  }
  ReportConstants.defaults?.set(json, forKey: ReportConstants.dailyTotalsKey)
}

private func formatMinutes(_ minutes: Int) -> String {
  if minutes < 60 { return "\(minutes)m" }
  let hours = minutes / 60
  let remainder = minutes % 60
  return remainder > 0 ? "\(hours)h \(remainder)m" : "\(hours)h"
}

private struct CategoryRow: Identifiable {
  let label: String
  let minutes: Int
  var id: String { label }
}

private func categoryRows(_ day: ScreenTimeReportDay) -> [CategoryRow] {
  [
    CategoryRow(label: "Social", minutes: day.byCategory["social"] ?? 0),
    CategoryRow(label: "Entertainment", minutes: day.byCategory["entertainment"] ?? 0),
    CategoryRow(label: "Productivity", minutes: day.byCategory["productivity"] ?? 0),
    CategoryRow(label: "Communication", minutes: day.byCategory["communication"] ?? 0),
    CategoryRow(label: "Other", minutes: day.byCategory["other"] ?? 0),
  ].filter { $0.minutes > 0 }
}

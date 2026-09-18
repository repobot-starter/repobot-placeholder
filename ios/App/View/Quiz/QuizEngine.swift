import Foundation

/// The quiz pack's engine: pure scoring and result logic, mirrored from the
/// web pack's engine.ts (and QuizEngine.kt on Android) so a score means the
/// same thing on every platform. No timers, no shuffling — questions run in
/// content order.
enum QuizEngine {
  struct Question {
    let prompt: String
    /// Two or more options; exactly one is right.
    let choices: [String]
    /// Index into choices of the correct answer.
    let answerIndex: Int
    /// Shown after answering — the "huh, neat" line that makes it stick.
    let explanation: String?

    init(prompt: String, choices: [String], answerIndex: Int, explanation: String? = nil) {
      self.prompt = prompt
      self.choices = choices
      self.answerIndex = answerIndex
      self.explanation = explanation
    }
  }

  /// One answered question: which choice was picked and whether it was right.
  struct AnswerRecord: Equatable {
    let questionIndex: Int
    let choiceIndex: Int
    let correct: Bool
  }

  static func answerQuestion(
    _ question: Question, questionIndex: Int, choiceIndex: Int
  ) -> AnswerRecord {
    AnswerRecord(
      questionIndex: questionIndex,
      choiceIndex: choiceIndex,
      correct: choiceIndex == question.answerIndex)
  }

  struct QuizResult: Equatable {
    let total: Int
    let correct: Int
    /// 0..100, rounded to the nearest whole percent.
    let percent: Int
  }

  static func summarize(_ records: [AnswerRecord], total: Int) -> QuizResult {
    let correct = records.filter(\.correct).count
    let percent = total == 0 ? 0 : Int((Double(correct) / Double(total) * 100).rounded())
    return QuizResult(total: total, correct: correct, percent: percent)
  }

  struct ResultLabel: Equatable {
    let emoji: String
    let title: String
    let message: String
  }

  /// The verdict line on the results screen, by percent scored.
  static func resultLabel(_ percent: Int) -> ResultLabel {
    if percent == 100 {
      return ResultLabel(
        emoji: "🏆", title: "Perfect score",
        message: "Every single one. Take the rest of the day off.")
    }
    if percent >= 80 {
      return ResultLabel(
        emoji: "🎯", title: "Sharp",
        message: "Nearly flawless — one more run and it's a sweep.")
    }
    if percent >= 60 {
      return ResultLabel(
        emoji: "👍", title: "Solid",
        message: "More right than wrong. The misses below are the good part.")
    }
    if percent >= 40 {
      return ResultLabel(
        emoji: "🌱", title: "Getting there",
        message: "A few landed. Read the misses and run it back.")
    }
    return ResultLabel(
      emoji: "🧭", title: "Uncharted territory",
      message: "Everything below is new to learn — that's the fun kind of quiz.")
  }

  /// Whether a finished run beats the saved best (strictly, so ties don't churn storage).
  static func isNewBest(previousPercent: Int?, percent: Int) -> Bool {
    guard let previous = previousPercent else { return true }
    return percent > previous
  }
}

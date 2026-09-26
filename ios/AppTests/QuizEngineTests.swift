import XCTest

@testable import AppIOS

/// Mirrors the web pack's engine.test.ts so quiz scoring means the same
/// thing on every platform.
final class QuizEngineTests: XCTestCase {
  private let question = QuizEngine.Question(
    prompt: "2 + 2?", choices: ["3", "4", "5"], answerIndex: 1)

  func testAnswerQuestionMarksCorrectness() {
    let right = QuizEngine.answerQuestion(question, questionIndex: 0, choiceIndex: 1)
    XCTAssertTrue(right.correct)
    XCTAssertEqual(right.questionIndex, 0)
    XCTAssertEqual(right.choiceIndex, 1)

    XCTAssertFalse(QuizEngine.answerQuestion(question, questionIndex: 0, choiceIndex: 2).correct)
  }

  func testSummarizeCountsAndRounds() {
    let records = [
      QuizEngine.answerQuestion(question, questionIndex: 0, choiceIndex: 1),
      QuizEngine.answerQuestion(question, questionIndex: 1, choiceIndex: 0),
      QuizEngine.answerQuestion(question, questionIndex: 2, choiceIndex: 1),
    ]
    XCTAssertEqual(
      QuizEngine.summarize(records, total: 3),
      QuizEngine.QuizResult(total: 3, correct: 2, percent: 67))
  }

  func testSummarizeHandlesEmptyQuiz() {
    XCTAssertEqual(
      QuizEngine.summarize([], total: 0),
      QuizEngine.QuizResult(total: 0, correct: 0, percent: 0))
  }

  func testSummarizeScoresAbandonedRunAgainstFullLength() {
    let records = [QuizEngine.answerQuestion(question, questionIndex: 0, choiceIndex: 1)]
    XCTAssertEqual(QuizEngine.summarize(records, total: 4).percent, 25)
  }

  func testResultLabelTiers() {
    XCTAssertEqual(QuizEngine.resultLabel(100).title, "Perfect score")
    XCTAssertEqual(QuizEngine.resultLabel(99).title, "Sharp")
    XCTAssertEqual(QuizEngine.resultLabel(80).title, "Sharp")
    XCTAssertEqual(QuizEngine.resultLabel(60).title, "Solid")
    XCTAssertEqual(QuizEngine.resultLabel(40).title, "Getting there")
    XCTAssertEqual(QuizEngine.resultLabel(0).title, "Uncharted territory")
  }

  func testIsNewBestRequiresStrictImprovement() {
    XCTAssertTrue(QuizEngine.isNewBest(previousPercent: nil, percent: 0))
    XCTAssertTrue(QuizEngine.isNewBest(previousPercent: 75, percent: 88))
    XCTAssertFalse(QuizEngine.isNewBest(previousPercent: 75, percent: 75))
    XCTAssertFalse(QuizEngine.isNewBest(previousPercent: 75, percent: 50))
  }
}

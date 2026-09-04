import XCTest

@testable import AppIOS

/// Guards the quiz data the pack ships with: best scores are keyed by quiz
/// id, and every answerIndex must point at a real choice.
final class QuizContentTests: XCTestCase {
  func testEveryQuizHasIdentityAndQuestions() {
    XCTAssertFalse(QuizContent.quizzes.isEmpty)
    for quiz in QuizContent.quizzes {
      XCTAssertFalse(quiz.id.isEmpty)
      XCTAssertFalse(quiz.title.isEmpty)
      XCTAssertFalse(quiz.emoji.isEmpty)
      XCTAssertFalse(quiz.description.isEmpty)
      XCTAssertFalse(quiz.questions.isEmpty, "quiz \(quiz.id) needs questions")
    }
  }

  func testQuizIdsAreUnique() {
    let ids = QuizContent.quizzes.map(\.id)
    XCTAssertEqual(Set(ids).count, ids.count)
  }

  func testEveryAnswerIndexPointsAtARealChoice() {
    for quiz in QuizContent.quizzes {
      for question in quiz.questions {
        XCTAssertGreaterThanOrEqual(question.choices.count, 2)
        XCTAssertTrue(
          (0..<question.choices.count).contains(question.answerIndex),
          "\(quiz.id): \(question.prompt)")
      }
    }
  }

  func testChoicesAreUniqueWithinEachQuestion() {
    for quiz in QuizContent.quizzes {
      for question in quiz.questions {
        XCTAssertEqual(
          Set(question.choices).count, question.choices.count,
          "\(quiz.id): \(question.prompt)")
      }
    }
  }
}

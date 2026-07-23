import SwiftUI

/// Pub-quiz palette, mirrored from QuizPage.styles.css.ts.
private enum QuizPalette {
  static let paper = Color(red: 0.980, green: 0.965, blue: 0.933)
  static let ink = Color(red: 0.133, green: 0.251, blue: 0.235)
  static let inkSoft = Color(red: 0.373, green: 0.463, blue: 0.447)
  static let line = Color(red: 0.902, green: 0.867, blue: 0.804)
  static let coral = Color(red: 0.851, green: 0.365, blue: 0.263)
  static let coralSoft = Color(red: 0.984, green: 0.914, blue: 0.894)
  static let brass = Color(red: 0.725, green: 0.545, blue: 0.184)
  static let green = Color(red: 0.184, green: 0.420, blue: 0.275)
  static let greenSoft = Color(red: 0.894, green: 0.937, blue: 0.902)
  static let red = Color(red: 0.627, green: 0.294, blue: 0.235)
  static let redSoft = Color(red: 0.965, green: 0.906, blue: 0.890)
}

/// Best finished run per quiz id, stored as JSON in UserDefaults (the
/// native mirror of the web pack's localStorage key).
private enum QuizStore {
  static let key = "quizbot-best"

  struct BestRun: Codable, Equatable {
    let percent: Int
    let correct: Int
    let total: Int
  }

  static func load() -> [String: BestRun] {
    guard let data = UserDefaults.standard.data(forKey: key),
      let decoded = try? JSONDecoder().decode([String: BestRun].self, from: data)
    else { return [:] }
    return decoded
  }

  static func save(_ best: [String: BestRun]) {
    if let data = try? JSONEncoder().encode(best) {
      UserDefaults.standard.set(data, forKey: key)
    }
  }
}

struct QuizView: View {
  @State private var openQuizId: String?
  @State private var best = QuizStore.load()

  var body: some View {
    ZStack {
      QuizPalette.paper.ignoresSafeArea()
      if let quiz = QuizContent.quizzes.first(where: { $0.id == openQuizId }) {
        QuizRunView(
          quiz: quiz,
          best: $best,
          onExit: { openQuizId = nil })
      } else {
        quizList
      }
    }
  }

  private var quizList: some View {
    ScrollView {
      VStack(spacing: 14) {
        VStack(spacing: 8) {
          Text(QuizContent.title)
            .font(.system(size: 36, weight: .bold, design: .serif))
            .foregroundStyle(QuizPalette.ink)
          Text(QuizContent.tagline)
            .font(.subheadline)
            .foregroundStyle(QuizPalette.inkSoft)
        }
        .padding(.top, 34)
        .padding(.bottom, 12)

        ForEach(QuizContent.quizzes) { quiz in
          quizRow(quiz)
        }

        Text("Instant feedback, no lifelines, misses explained. Built with Repobot.")
          .font(.caption)
          .foregroundStyle(QuizPalette.inkSoft)
          .padding(.top, 24)
      }
      .padding(.horizontal, 22)
      .padding(.bottom, 48)
    }
  }

  private func quizRow(_ quiz: QuizContent.Quiz) -> some View {
    Button {
      openQuizId = quiz.id
    } label: {
      HStack(spacing: 14) {
        Text(quiz.emoji)
          .font(.system(size: 28))
          .frame(width: 52, height: 52)
          .background(RoundedRectangle(cornerRadius: 14).fill(QuizPalette.coralSoft))
        VStack(alignment: .leading, spacing: 4) {
          Text(quiz.title)
            .font(.system(size: 18, weight: .semibold, design: .serif))
            .foregroundStyle(QuizPalette.ink)
          Text(quiz.description)
            .font(.caption)
            .foregroundStyle(QuizPalette.inkSoft)
            .multilineTextAlignment(.leading)
          Text("\(quiz.questions.count) questions")
            .font(.caption2)
            .foregroundStyle(QuizPalette.inkSoft)
        }
        Spacer()
        if let bestRun = best[quiz.id] {
          Text("Best \(bestRun.percent)%")
            .font(.caption2.weight(.bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(QuizPalette.brass))
        } else {
          Text("Not taken")
            .font(.caption2.weight(.bold))
            .foregroundStyle(QuizPalette.coral)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(QuizPalette.coralSoft))
        }
      }
      .padding(16)
      .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
      .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(QuizPalette.line))
    }
    .buttonStyle(.plain)
  }
}

private struct QuizRunView: View {
  let quiz: QuizContent.Quiz
  @Binding var best: [String: QuizStore.BestRun]
  let onExit: () -> Void

  @State private var records: [QuizEngine.AnswerRecord] = []
  @State private var picked: Int?
  @State private var finished = false
  @State private var newBest = false

  private var questionIndex: Int { records.count - (picked == nil ? 0 : 1) }

  var body: some View {
    if finished {
      resultsView
    } else {
      runView
    }
  }

  private var runView: some View {
    let question = quiz.questions[questionIndex]
    let answered = picked != nil
    let lastQuestion = questionIndex == quiz.questions.count - 1
    let progress = Double(questionIndex + (answered ? 1 : 0)) / Double(quiz.questions.count)

    return ScrollView {
      VStack(spacing: 0) {
        HStack {
          Button(action: onExit) {
            Label(quiz.title, systemImage: "arrow.left")
              .font(.footnote.weight(.semibold))
              .foregroundStyle(QuizPalette.coral)
          }
          .buttonStyle(.plain)
          Spacer()
          Text("\(questionIndex + 1) of \(quiz.questions.count)")
            .font(.footnote)
            .foregroundStyle(QuizPalette.inkSoft)
        }
        .padding(.top, 22)

        GeometryReader { geo in
          ZStack(alignment: .leading) {
            Capsule().fill(QuizPalette.line)
            Capsule().fill(QuizPalette.coral)
              .frame(width: geo.size.width * progress)
          }
        }
        .frame(height: 6)
        .padding(.top, 16)

        VStack(alignment: .leading, spacing: 0) {
          Text(question.prompt)
            .font(.system(size: 22, weight: .semibold, design: .serif))
            .foregroundStyle(QuizPalette.ink)
            .fixedSize(horizontal: false, vertical: true)

          VStack(spacing: 10) {
            ForEach(Array(question.choices.enumerated()), id: \.offset) { index, choice in
              choiceButton(choice, index: index, question: question, answered: answered)
            }
          }
          .padding(.top, 22)

          if answered, let explanation = question.explanation {
            Text(explanation)
              .font(.footnote)
              .foregroundStyle(QuizPalette.ink)
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(14)
              .background(RoundedRectangle(cornerRadius: 12).fill(QuizPalette.coralSoft))
              .padding(.top, 18)
          }

          if answered {
            Button {
              advance()
            } label: {
              Text(lastQuestion ? "See results" : "Next question")
                .font(.body.weight(.bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(RoundedRectangle(cornerRadius: 14).fill(QuizPalette.coral))
            }
            .buttonStyle(.plain)
            .padding(.top, 20)
          }
        }
        .padding(24)
        .background(RoundedRectangle(cornerRadius: 20).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(QuizPalette.line))
        .padding(.top, 18)
      }
      .padding(.horizontal, 22)
      .padding(.bottom, 48)
    }
  }

  private func choiceButton(
    _ choice: String, index: Int, question: QuizEngine.Question, answered: Bool
  ) -> some View {
    let isCorrect = index == question.answerIndex
    let isPicked = index == picked

    var background = QuizPalette.paper
    var foreground = QuizPalette.ink
    var border = QuizPalette.line
    var opacity = 1.0
    if answered {
      if isCorrect {
        background = QuizPalette.greenSoft
        foreground = QuizPalette.green
        border = QuizPalette.green
      } else if isPicked {
        background = QuizPalette.redSoft
        foreground = QuizPalette.red
        border = QuizPalette.red
      } else {
        opacity = 0.55
      }
    }

    return Button {
      pick(index)
    } label: {
      Text(choice)
        .font(.subheadline.weight(answered && (isCorrect || isPicked) ? .bold : .medium))
        .foregroundStyle(foreground)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .background(RoundedRectangle(cornerRadius: 12).fill(background))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(border))
    }
    .buttonStyle(.plain)
    .disabled(answered)
    .opacity(opacity)
  }

  private var resultsView: some View {
    let result = QuizEngine.summarize(records, total: quiz.questions.count)
    let label = QuizEngine.resultLabel(result.percent)
    let misses = records.filter { !$0.correct }

    return ScrollView {
      VStack(spacing: 10) {
        Text(label.emoji)
          .font(.system(size: 44))
          .padding(.top, 40)
        Text(label.title)
          .font(.system(size: 24, weight: .bold, design: .serif))
          .foregroundStyle(QuizPalette.ink)
        Text(label.message)
          .font(.subheadline)
          .foregroundStyle(QuizPalette.inkSoft)
          .multilineTextAlignment(.center)

        HStack(spacing: 28) {
          statBlock("\(result.correct)/\(result.total)", label: "correct")
          statBlock("\(result.percent)%", label: "score")
        }
        .padding(.top, 14)

        if newBest {
          Text("★ New personal best")
            .font(.footnote.weight(.bold))
            .foregroundStyle(QuizPalette.brass)
            .padding(.top, 4)
        }

        if !misses.isEmpty {
          VStack(spacing: 10) {
            ForEach(misses, id: \.questionIndex) { record in
              let missed = quiz.questions[record.questionIndex]
              VStack(alignment: .leading, spacing: 4) {
                Text(missed.prompt)
                  .font(.footnote.weight(.bold))
                  .foregroundStyle(QuizPalette.ink)
                Text(missed.choices[missed.answerIndex])
                  .font(.footnote.weight(.semibold))
                  .foregroundStyle(QuizPalette.green)
                if let explanation = missed.explanation {
                  Text(explanation)
                    .font(.caption)
                    .foregroundStyle(QuizPalette.inkSoft)
                }
              }
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(14)
              .background(RoundedRectangle(cornerRadius: 12).fill(Color.white))
              .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(QuizPalette.line))
            }
          }
          .padding(.top, 18)
        }

        HStack(spacing: 12) {
          Button(action: restart) {
            Text("Run it back")
              .font(.body.weight(.bold))
              .foregroundStyle(QuizPalette.coral)
              .frame(maxWidth: .infinity)
              .padding(.vertical, 15)
              .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
              .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(QuizPalette.coral))
          }
          .buttonStyle(.plain)
          Button(action: onExit) {
            Text("Back to quizzes")
              .font(.body.weight(.bold))
              .foregroundStyle(.white)
              .frame(maxWidth: .infinity)
              .padding(.vertical, 15)
              .background(RoundedRectangle(cornerRadius: 14).fill(QuizPalette.coral))
          }
          .buttonStyle(.plain)
        }
        .padding(.top, 20)
      }
      .padding(.horizontal, 22)
      .padding(.bottom, 48)
    }
  }

  private func statBlock(_ number: String, label: String) -> some View {
    VStack(spacing: 2) {
      Text(number)
        .font(.system(size: 26, weight: .bold, design: .serif))
        .foregroundStyle(QuizPalette.coral)
      Text(label)
        .font(.caption2)
        .foregroundStyle(QuizPalette.inkSoft)
    }
  }

  private func pick(_ choiceIndex: Int) {
    guard picked == nil else { return }
    let question = quiz.questions[questionIndex]
    records.append(
      QuizEngine.answerQuestion(question, questionIndex: questionIndex, choiceIndex: choiceIndex))
    picked = choiceIndex
  }

  private func advance() {
    let done = records.count == quiz.questions.count
    picked = nil
    if done {
      let result = QuizEngine.summarize(records, total: quiz.questions.count)
      if QuizEngine.isNewBest(previousPercent: best[quiz.id]?.percent, percent: result.percent) {
        best[quiz.id] = QuizStore.BestRun(
          percent: result.percent, correct: result.correct, total: result.total)
        QuizStore.save(best)
        newBest = true
      }
      finished = true
    }
  }

  private func restart() {
    records = []
    picked = nil
    finished = false
    newBest = false
  }
}

#Preview {
  QuizView()
}

package com.baseapp.android.view.quiz

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Pub-quiz palette, mirrored from the web pack's QuizPage.styles.css.ts. */
private object QuizColors {
    val paper = Color(0xFFFAF6EE)
    val ink = Color(0xFF22403C)
    val inkSoft = Color(0xFF5F7672)
    val line = Color(0xFFE6DDCD)
    val coral = Color(0xFFD95D43)
    val coralSoft = Color(0xFFFBE9E4)
    val brass = Color(0xFFB98B2F)
    val green = Color(0xFF2F6B46)
    val greenSoft = Color(0xFFE4EFE6)
    val red = Color(0xFFA04B3C)
    val redSoft = Color(0xFFF6E7E3)
}

private const val PREFS_NAME = "quizbot"

/**
 * Best finished run per quiz id, one SharedPreferences entry per quiz
 * ("quizId" -> "percent,correct,total"). The native mirror of the web
 * pack's localStorage key.
 */
private object QuizStore {
    data class BestRun(val percent: Int, val correct: Int, val total: Int)

    fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun load(prefs: SharedPreferences): Map<String, BestRun> {
        val best = mutableMapOf<String, BestRun>()
        for ((key, value) in prefs.all) {
            val parts = (value as? String)?.split(",")
            if (parts?.size != 3) continue
            val percent = parts[0].toIntOrNull() ?: continue
            val correct = parts[1].toIntOrNull() ?: continue
            val total = parts[2].toIntOrNull() ?: continue
            best[key] = BestRun(percent = percent, correct = correct, total = total)
        }
        return best
    }

    fun save(prefs: SharedPreferences, quizId: String, run: BestRun) {
        prefs.edit().putString(quizId, "${run.percent},${run.correct},${run.total}").apply()
    }
}

/**
 * Home surface for the `quiz` pack — the native twin of the web QuizPage.
 * All scoring lives in [QuizEngine] so it stays JVM-testable and in
 * lockstep with the web app. Purely client-side: best scores persist to
 * SharedPreferences, no network, no stores.
 */
@Composable
fun QuizView() {
    val context = LocalContext.current
    val prefs = remember { QuizStore.prefs(context) }
    var best by remember { mutableStateOf(QuizStore.load(prefs)) }
    var openQuizId by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(QuizColors.paper),
        contentAlignment = Alignment.TopCenter,
    ) {
        val openQuiz = QuizContent.quizzes.firstOrNull { it.id == openQuizId }
        if (openQuiz != null) {
            QuizRun(
                quiz = openQuiz,
                bestPercent = best[openQuiz.id]?.percent,
                onNewBest = { run ->
                    QuizStore.save(prefs, openQuiz.id, run)
                    best = best + (openQuiz.id to run)
                },
                onExit = { openQuizId = null },
            )
        } else {
            QuizList(best = best, onOpen = { openQuizId = it })
        }
    }
}

@Composable
private fun QuizList(best: Map<String, QuizStore.BestRun>, onOpen: (String) -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier
            .widthIn(max = 640.dp)
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp)
            .padding(top = 34.dp, bottom = 48.dp),
    ) {
        Text(
            text = QuizContent.TITLE,
            color = QuizColors.ink,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = QuizContent.TAGLINE,
            color = QuizColors.inkSoft,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 12.dp),
        )

        QuizContent.quizzes.forEach { quiz ->
            QuizRow(quiz = quiz, bestRun = best[quiz.id], onOpen = { onOpen(quiz.id) })
        }

        Text(
            text = "Instant feedback, no lifelines, misses explained. Built with Repobot.",
            color = QuizColors.inkSoft,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 24.dp),
        )
    }
}

@Composable
private fun QuizRow(quiz: QuizContent.Quiz, bestRun: QuizStore.BestRun?, onOpen: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, QuizColors.line, RoundedCornerShape(16.dp))
            .clickable(onClick = onOpen)
            .padding(16.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(QuizColors.coralSoft),
        ) {
            Text(text = quiz.emoji, fontSize = 26.sp)
        }
        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 14.dp),
        ) {
            Text(
                text = quiz.title,
                color = QuizColors.ink,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Serif,
            )
            Text(
                text = quiz.description,
                color = QuizColors.inkSoft,
                fontSize = 12.sp,
            )
            Text(
                text = "${quiz.questions.size} questions",
                color = QuizColors.inkSoft,
                fontSize = 11.sp,
            )
        }
        if (bestRun != null) {
            Badge(text = "Best ${bestRun.percent}%", background = QuizColors.brass, foreground = Color.White)
        } else {
            Badge(text = "Not taken", background = QuizColors.coralSoft, foreground = QuizColors.coral)
        }
    }
}

@Composable
private fun Badge(text: String, background: Color, foreground: Color) {
    Text(
        text = text,
        color = foreground,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .clip(CircleShape)
            .background(background)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

@Composable
private fun QuizRun(
    quiz: QuizContent.Quiz,
    bestPercent: Int?,
    onNewBest: (QuizStore.BestRun) -> Unit,
    onExit: () -> Unit,
) {
    var records by remember { mutableStateOf(listOf<QuizEngine.AnswerRecord>()) }
    var picked by remember { mutableStateOf<Int?>(null) }
    var finished by remember { mutableStateOf(false) }
    var newBest by remember { mutableStateOf(false) }

    val questionIndex = records.size - if (picked == null) 0 else 1

    fun pick(choiceIndex: Int) {
        if (picked != null) return
        val question = quiz.questions[questionIndex]
        records = records + QuizEngine.answerQuestion(question, questionIndex, choiceIndex)
        picked = choiceIndex
    }

    fun advance() {
        val done = records.size == quiz.questions.size
        picked = null
        if (done) {
            val result = QuizEngine.summarize(records, quiz.questions.size)
            if (QuizEngine.isNewBest(bestPercent, result.percent)) {
                onNewBest(
                    QuizStore.BestRun(
                        percent = result.percent,
                        correct = result.correct,
                        total = result.total,
                    ),
                )
                newBest = true
            }
            finished = true
        }
    }

    fun restart() {
        records = listOf()
        picked = null
        finished = false
        newBest = false
    }

    if (finished) {
        QuizResults(
            quiz = quiz,
            records = records,
            newBest = newBest,
            onRestart = ::restart,
            onExit = onExit,
        )
        return
    }

    val question = quiz.questions[questionIndex]
    val answered = picked != null
    val lastQuestion = questionIndex == quiz.questions.size - 1
    val progress = (questionIndex + if (answered) 1 else 0).toFloat() / quiz.questions.size

    Column(
        modifier = Modifier
            .widthIn(max = 640.dp)
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp)
            .padding(bottom = 48.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 22.dp),
        ) {
            Text(
                text = "← ${quiz.title}",
                color = QuizColors.coral,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onExit)
                    .padding(4.dp),
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = "${questionIndex + 1} of ${quiz.questions.size}",
                color = QuizColors.inkSoft,
                fontSize = 13.sp,
            )
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp)
                .height(6.dp)
                .clip(CircleShape)
                .background(QuizColors.line),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(progress)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(QuizColors.coral),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 18.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .border(1.dp, QuizColors.line, RoundedCornerShape(20.dp))
                .padding(24.dp),
        ) {
            Text(
                text = question.prompt,
                color = QuizColors.ink,
                fontSize = 22.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Serif,
                lineHeight = 28.sp,
            )

            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.padding(top = 22.dp),
            ) {
                question.choices.forEachIndexed { index, choice ->
                    ChoiceRow(
                        text = choice,
                        isCorrect = index == question.answerIndex,
                        isPicked = index == picked,
                        answered = answered,
                        onPick = { pick(index) },
                    )
                }
            }

            if (answered && question.explanation != null) {
                Text(
                    text = question.explanation,
                    color = QuizColors.ink,
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 18.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(QuizColors.coralSoft)
                        .padding(14.dp),
                )
            }

            if (answered) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 20.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(QuizColors.coral)
                        .clickable(onClick = ::advance)
                        .padding(vertical = 15.dp),
                ) {
                    Text(
                        text = if (lastQuestion) "See results" else "Next question",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

@Composable
private fun ChoiceRow(
    text: String,
    isCorrect: Boolean,
    isPicked: Boolean,
    answered: Boolean,
    onPick: () -> Unit,
) {
    val background = when {
        answered && isCorrect -> QuizColors.greenSoft
        answered && isPicked -> QuizColors.redSoft
        else -> QuizColors.paper
    }
    val foreground = when {
        answered && isCorrect -> QuizColors.green
        answered && isPicked -> QuizColors.red
        else -> QuizColors.ink
    }
    val border = when {
        answered && isCorrect -> QuizColors.green
        answered && isPicked -> QuizColors.red
        else -> QuizColors.line
    }
    val dimmed = answered && !isCorrect && !isPicked

    Text(
        text = text,
        color = foreground,
        fontSize = 14.sp,
        fontWeight = if (answered && (isCorrect || isPicked)) FontWeight.Bold else FontWeight.Medium,
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (dimmed) 0.55f else 1f)
            .clip(RoundedCornerShape(12.dp))
            .background(background)
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .clickable(enabled = !answered, onClick = onPick)
            .padding(horizontal = 16.dp, vertical = 13.dp),
    )
}

@Composable
private fun QuizResults(
    quiz: QuizContent.Quiz,
    records: List<QuizEngine.AnswerRecord>,
    newBest: Boolean,
    onRestart: () -> Unit,
    onExit: () -> Unit,
) {
    val result = QuizEngine.summarize(records, quiz.questions.size)
    val label = QuizEngine.resultLabel(result.percent)
    val misses = records.filter { !it.correct }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier
            .widthIn(max = 640.dp)
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp)
            .padding(top = 40.dp, bottom = 48.dp),
    ) {
        Text(text = label.emoji, fontSize = 44.sp)
        Text(
            text = label.title,
            color = QuizColors.ink,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = label.message,
            color = QuizColors.inkSoft,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
        )

        Row(
            horizontalArrangement = Arrangement.spacedBy(28.dp),
            modifier = Modifier.padding(top = 14.dp),
        ) {
            StatBlock(number = "${result.correct}/${result.total}", label = "correct")
            StatBlock(number = "${result.percent}%", label = "score")
        }

        if (newBest) {
            Text(
                text = "★ New personal best",
                color = QuizColors.brass,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        if (misses.isNotEmpty()) {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.padding(top = 18.dp),
            ) {
                misses.forEach { record ->
                    val missed = quiz.questions[record.questionIndex]
                    Column(
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .border(1.dp, QuizColors.line, RoundedCornerShape(12.dp))
                            .padding(14.dp),
                    ) {
                        Text(
                            text = missed.prompt,
                            color = QuizColors.ink,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = missed.choices[missed.answerIndex],
                            color = QuizColors.green,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        if (missed.explanation != null) {
                            Text(
                                text = missed.explanation,
                                color = QuizColors.inkSoft,
                                fontSize = 12.sp,
                            )
                        }
                    }
                }
            }
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(top = 20.dp),
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White)
                    .border(1.dp, QuizColors.coral, RoundedCornerShape(14.dp))
                    .clickable(onClick = onRestart)
                    .padding(vertical = 15.dp),
            ) {
                Text(
                    text = "Run it back",
                    color = QuizColors.coral,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(QuizColors.coral)
                    .clickable(onClick = onExit)
                    .padding(vertical = 15.dp),
            ) {
                Text(
                    text = "Back to quizzes",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

@Composable
private fun StatBlock(number: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = number,
            color = QuizColors.coral,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = label,
            color = QuizColors.inkSoft,
            fontSize = 11.sp,
        )
    }
}

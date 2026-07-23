package com.baseapp.android

import com.baseapp.android.view.sugar.SugarContent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Guards the pastry and machine data the sugar pack ships with. */
class SugarContentTest {
    @Test
    fun everyLineupHasPastriesAtHonestPrices() {
        assertFalse(SugarContent.lineups.isEmpty())
        for (lineup in SugarContent.lineups) {
            assertFalse(lineup.title.isEmpty())
            assertFalse(lineup.pastries.isEmpty())
            for (pastry in lineup.pastries) {
                assertFalse(pastry.name.isEmpty())
                assertTrue(pastry.priceCents > 0)
            }
        }
    }

    @Test
    fun pastryNamesUniqueWithinEachLineup() {
        for (lineup in SugarContent.lineups) {
            val names = lineup.pastries.map { it.name }
            assertEquals(lineup.title, names.toSet().size, names.size)
        }
    }

    @Test
    fun everyMachineHasACoherentSchedule() {
        assertFalse(SugarContent.machines.isEmpty())
        for (machine in SugarContent.machines) {
            assertFalse(machine.name.isEmpty())
            assertFalse(machine.schedule.stockedDays.isEmpty())
            for (day in machine.schedule.stockedDays) {
                assertTrue(machine.name, day in 0..6)
            }
            assertTrue(machine.schedule.restockMinute >= 0)
            assertTrue(machine.schedule.restockMinute < machine.schedule.selloutMinute)
            assertTrue(machine.schedule.selloutMinute < 24 * 60)
        }
    }

    @Test
    fun machineNamesAreUnique() {
        val names = SugarContent.machines.map { it.name }
        assertEquals(names.toSet().size, names.size)
    }
}

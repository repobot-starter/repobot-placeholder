import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingSchedule, type MarketingScheduleDay } from "./MarketingSchedule"

const meta: Meta<typeof MarketingSchedule> = {
    title: "Marketing/Schedule",
    component: MarketingSchedule,
    decorators: [
        (Story) => (
            <MarketingPage preset="chalk">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingSchedule>

const days: MarketingScheduleDay[] = [
    {
        label: "Monday",
        sessions: [
            { time: "6:00 AM", endTime: "7:00 AM", title: "Strength 101", detail: "Reyes" },
            { time: "12:00 PM", endTime: "12:45 PM", title: "Lunch Express", detail: "Cole" },
            { time: "5:30 PM", endTime: "6:30 PM", title: "Barbell Club", detail: "Reyes" },
        ],
    },
    {
        label: "Tuesday",
        today: true,
        sessions: [
            { time: "6:00 AM", endTime: "7:00 AM", title: "Conditioning", detail: "Whit", state: "now" },
            {
                time: "5:30 PM",
                endTime: "6:30 PM",
                title: "Olympic Lifting",
                detail: "Cole",
                note: "Intermediate",
                state: "next",
            },
        ],
    },
    {
        label: "Wednesday",
        sessions: [
            { time: "6:00 AM", endTime: "7:00 AM", title: "Strength 101", detail: "Reyes" },
            { time: "5:30 PM", endTime: "6:30 PM", title: "Conditioning", detail: "Whit" },
        ],
    },
    {
        label: "Friday",
        sessions: [{ time: "6:00 AM", endTime: "7:00 AM", title: "Barbell Club", detail: "Reyes" }],
    },
    {
        label: "Saturday",
        sessions: [
            { time: "9:00 AM", endTime: "10:00 AM", title: "Team Session", detail: "All coaches" },
            { time: "10:30 AM", endTime: "12:00 PM", title: "Open Gym", detail: "Staffed floor" },
        ],
    },
]

export const WeekGrid: Story = {
    args: {
        variant: "week-grid",
        kicker: "Schedule",
        title: "The week at a glance",
        badge: "In session — Conditioning until 7:00 AM",
        days,
        note: "Drop-ins welcome at every class. Reserve a spot up to seven days out; unreserved spots open at the whistle.",
        cta: { label: "Start your free week", href: "/trial" },
    },
}

export const DayRows: Story = {
    args: {
        variant: "day-rows",
        kicker: "The training week",
        title: "Where the hours go",
        days,
        note: "One-on-one blocks book by application.",
    },
}

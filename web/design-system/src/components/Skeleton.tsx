import React from "react"
import * as styles from "./Skeleton.styles.css"

export interface SkeletonProps {
    width?: number | string
    height?: number | string
    style?: React.CSSProperties
}

export function Skeleton({ width = "100%", height = 16, style }: SkeletonProps): React.ReactElement {
    return <span aria-hidden="true" className={styles.skeleton} style={{ width, height, ...style }} />
}

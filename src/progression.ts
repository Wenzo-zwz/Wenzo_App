import type { ToolId } from './dollEngine';

export const STAGE_THRESHOLDS = [1, 5, 10, 18] as const;

export const TOOL_STAGES: Record<ToolId, readonly [string, string, string, string]> = {
  punch: ['棉花拳', '眼冒金星', '补丁上线', '软成一张饼'],
  slap: ['轻轻拍拍', '脸颊鼓鼓', '晕乎乎', '小气球脸'],
  hammer: ['咚咚敲', '压扁一点', '弹簧上线', '软成手风琴'],
  tomato: ['一颗番茄', '酱汁点点', '满身番茄', '番茄酱小人'],
  pillow: ['羽毛飘飘', '沾点绒毛', '云朵包围', '棉花云团子'],
  lightning: ['静电来啦', '绒毛炸起', '霹雳爆炸头', '电量满格'],
  tornado: ['微风摇摇', '双脚离地', '旋转升空', '龙卷风卷飞'],
  ice: ['初雪发抖', '鼻涕泡泡', '冰霜爬上身', '冻成小冰人'],
  fire: ['小火苗', '开始冒烟', '焦糖小黑脸', '黑芝麻团子'],
  tickle: ['忍住不笑', '笑出声音', '笑出眼泪', '笑到打滚'],
  confetti: ['撒点彩纸', '戴上派对帽', '彩带大游行', '今天你是主角'],
  hug: ['轻轻抱抱', '暖乎乎', '爱心小毯子', '被爱包围'],
};

export type ToolProgress = {
  tool: ToolId;
  count: number;
  stage: 0 | 1 | 2 | 3 | 4;
  label: string;
  nextLabel: string | null;
  nextAt: number | null;
  remaining: number;
  ratio: number;
};

/** Progress depends only on this tool's interaction count, never strength or other tools. */
export function getToolProgress(tool: ToolId, rawCount: number): ToolProgress {
  const count = Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
  const stage = STAGE_THRESHOLDS.filter((threshold) => count >= threshold)
    .length as ToolProgress['stage'];
  const nextAt = STAGE_THRESHOLDS.at(stage) ?? null;
  return {
    tool,
    count,
    stage,
    label: stage ? TOOL_STAGES[tool][stage - 1] : '准备好，第一下会发生什么？',
    nextLabel: TOOL_STAGES[tool].at(stage) ?? null,
    nextAt,
    remaining: nextAt === null ? 0 : nextAt - count,
    ratio: Math.min(1, count / STAGE_THRESHOLDS[3]),
  };
}

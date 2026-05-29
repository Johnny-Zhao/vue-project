import type { SortDirection } from '@/types/study'

// 这个类型的意思是：
// “排序时，最终我们只处理 string 或 number 这两种值”
// 因为浏览器里最常见的排序字段，通常也就是文本或数字。
type SortableValue = string | number

// 这个函数的作用是“兜底转换”：
// 不管外面传进来的值原本是什么类型，
// 最后都统一转换成能参与排序的 string 或 number。
//
// 参数写成 unknown，表示：
// “我现在还不知道它是什么类型，所以不能直接拿来用，
//  必须先做判断，再决定怎么处理。”
function normalizeSortValue(value: unknown): SortableValue {
  if (typeof value === 'number') {
    return value
  }

  // 如果不是 number，就转成字符串处理。
  // 例如 title、status、priority 这类字段都会走到这里。
  return String(value)
}

// 这是一个“通用排序函数”。
//
// <T, K extends keyof T> 是泛型写法，分开看：
//
// 1. T 表示“任意一种对象类型”
//    例如在我们当前项目里，T 可以是 StudyTask。
//
// 2. keyof T 表示“取出 T 的所有字段名”
//    如果 T 是 StudyTask，那么 keyof T 大致就是：
//    'id' | 'title' | 'summary' | 'category' | 'status' | 'priority' | 'estimateHours'
//
// 3. K extends keyof T 表示：
//    “K 这个字段名，必须是 T 真实存在的字段名之一”
//
// 所以这个函数不是随便传一个字符串都行，
// 只有合法字段名才能传进来。
export function sortByField<T, K extends keyof T>(
  // list: T[] 表示“这是一个对象数组”
  // 如果 T 是 StudyTask，那么这里就是 StudyTask[]。
  list: T[],

  // field: K 表示“按哪个字段排序”
  // 因为 K 已经被限制成 keyof T，所以这里不会乱传。
  field: K,

  // direction 有默认值 'asc'
  // 也就是如果外面不传，默认按升序排。
  direction: SortDirection = 'asc',
): T[] {
  // directionFactor 是一个小技巧：
  // 升序时用 1，降序时用 -1
  // 这样后面比较结果只要乘一下，就能统一处理升序和降序。
  const directionFactor = direction === 'asc' ? 1 : -1

  // [...list] 先复制一份数组，再排序。
  // 这样不会直接修改原数组，属于比较安全的写法。
  return [...list].sort((leftItem, rightItem) => {
    // leftItem[field] 的意思是：
    // “取左边这条数据中，field 对应的值”
    //
    // 如果 field 是 'title'，那就是 leftItem.title
    // 如果 field 是 'estimateHours'，那就是 leftItem.estimateHours
    const leftValue = normalizeSortValue(leftItem[field])
    const rightValue = normalizeSortValue(rightItem[field])

    // 如果左右两边都是数字，就按数字大小比较。
    // 例如按 estimateHours 排序时，就会走这里。
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * directionFactor
    }

    // 否则就按字符串比较。
    // localeCompare 比普通 > < 更适合处理文本排序，
    // 这里传 'zh-CN' 是为了让中文场景下的比较更自然一些。
    return String(leftValue).localeCompare(String(rightValue), 'zh-CN') * directionFactor
  })
}

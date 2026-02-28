import Dexie, { type Table } from 'dexie'
import type { Project, Category, SubCategory, Task, TaskHistory } from '../types'

export class PmcDatabase extends Dexie {
  projects!: Table<Project>
  categories!: Table<Category>
  subCategories!: Table<SubCategory>
  tasks!: Table<Task>
  taskHistory!: Table<TaskHistory>

  constructor() {
    super('PmcTaskBoard')
    this.version(1).stores({
      projects: '++id, name, status, createdAt, updatedAt',
      categories: '++id, projectId, order, createdAt, updatedAt',
      subCategories: '++id, categoryId, projectId, order, createdAt, updatedAt',
      tasks: '++id, subCategoryId, categoryId, projectId, status, priority, dueDate, createdAt, updatedAt',
      taskHistory: '++id, taskId, changedAt',
    })
  }
}

export const db = new PmcDatabase()

// Seed data for first run
export async function seedDatabase() {
  const projectCount = await db.projects.count()
  if (projectCount > 0) return

  const now = new Date().toISOString()

  const projectId = await db.projects.add({
    name: 'Modbus TCP 드라이버 개발',
    description: '반도체 장비용 Modbus TCP 클라이언트 드라이버 라이브러리 개발',
    status: 'ACTIVE',
    color: '#3b82f6',
    createdAt: now,
    updatedAt: now,
  })

  const cat1Id = await db.categories.add({
    projectId: projectId as number,
    name: '설계 및 아키텍처',
    order: 0,
    createdAt: now,
    updatedAt: now,
  })

  const cat2Id = await db.categories.add({
    projectId: projectId as number,
    name: '구현',
    order: 1,
    createdAt: now,
    updatedAt: now,
  })

  const sub1Id = await db.subCategories.add({
    categoryId: cat1Id as number,
    projectId: projectId as number,
    name: '공개 API 설계',
    order: 0,
    createdAt: now,
    updatedAt: now,
  })

  const sub2Id = await db.subCategories.add({
    categoryId: cat2Id as number,
    projectId: projectId as number,
    name: '소켓 통신',
    order: 0,
    createdAt: now,
    updatedAt: now,
  })

  const sub3Id = await db.subCategories.add({
    categoryId: cat2Id as number,
    projectId: projectId as number,
    name: '재연결 정책',
    order: 1,
    createdAt: now,
    updatedAt: now,
  })

  await db.tasks.bulkAdd([
    {
      subCategoryId: sub1Id as number,
      categoryId: cat1Id as number,
      projectId: projectId as number,
      title: 'ModbusDriver.h 공개 헤더 정의',
      description: '불투명 핸들(MODBUS_HANDLE) 및 전역 함수 시그니처 정의',
      status: 'DONE',
      priority: 'HIGH',
      assignee: '나',
      dueDate: '',
      progress: 100,
      checklist: [
        { id: '1', text: 'MODBUS_HANDLE 타입 정의', done: true },
        { id: '2', text: 'Create/Destroy 함수 선언', done: true },
        { id: '3', text: 'SendSync 함수 선언', done: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      subCategoryId: sub2Id as number,
      categoryId: cat2Id as number,
      projectId: projectId as number,
      title: 'Winsock2 연결 구현',
      description: 'TCP connect, send, recv 기본 구현',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: '나',
      dueDate: '2026-03-15',
      progress: 60,
      checklist: [
        { id: '1', text: 'WSAStartup/Cleanup RAII', done: true },
        { id: '2', text: 'connect() 구현', done: true },
        { id: '3', text: 'send/recv 타임아웃', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      subCategoryId: sub3Id as number,
      categoryId: cat2Id as number,
      projectId: projectId as number,
      title: '지수 백오프 재연결',
      description: '1s → 2s → 4s → ... → 30s cap 지수 백오프 구현',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: '나',
      dueDate: '2026-03-20',
      progress: 0,
      checklist: [],
      createdAt: now,
      updatedAt: now,
    },
  ])
}

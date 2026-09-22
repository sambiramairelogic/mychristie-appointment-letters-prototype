const letters = require('../data/letters')

function buildQuery(page, selectedFilter, searchTerm) {
  const params = new URLSearchParams({ page: String(page) })

  if (selectedFilter) {
    params.set('filter', selectedFilter)
  }

  if (searchTerm) {
    params.set('search-letters', searchTerm)
  }

  return `?${params.toString()}`
}

function buildPaginationItems(currentPage, totalPages, basePath, selectedFilter, searchTerm) {
  const items = []

  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page++) {
      items.push({
        number: page,
        href: `${basePath}${buildQuery(page, selectedFilter, searchTerm)}`,
        current: page === currentPage
      })
    }
    return items
  }

  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(totalPages - 1, currentPage + 1)

  items.push({
    number: 1,
    href: `${basePath}${buildQuery(1, selectedFilter, searchTerm)}`,
    current: currentPage === 1
  })

  if (windowStart > 2) {
    items.push({ ellipsis: true })
  }

  for (let page = windowStart; page <= windowEnd; page++) {
    items.push({
      number: page,
      href: `${basePath}${buildQuery(page, selectedFilter, searchTerm)}`,
      current: page === currentPage
    })
  }

  if (windowEnd < totalPages - 1) {
    items.push({ ellipsis: true })
  }

  items.push({
    number: totalPages,
    href: `${basePath}${buildQuery(totalPages, selectedFilter, searchTerm)}`,
    current: currentPage === totalPages
  })

  return items
}

function paginateData(req, basePath, options = {}) {
  const { enableSearch = false } = options
  const pageSize = 5
  const validFilters = ['all', 'read', 'unread']
  const selectedFilter = validFilters.includes(req.query.filter)
    ? req.query.filter
    : 'all'
  const searchTerm = enableSearch && typeof req.query['search-letters'] === 'string'
    ? req.query['search-letters'].trim()
    : ''
  const lowerCaseSearchTerm = searchTerm.toLowerCase()
  let filteredLetters = selectedFilter
    ? letters.allLetters.filter((letter) => (selectedFilter === 'all' || letter.status === selectedFilter))
    : letters.allLetters

  if (lowerCaseSearchTerm) {
    filteredLetters = filteredLetters.filter((letter) => (
      Object.values(letter).some((value) => String(value).toLowerCase().includes(lowerCaseSearchTerm))
    ))
  }

  const totalLetters = filteredLetters.length
  const totalPages = Math.max(1, Math.ceil(totalLetters / pageSize))
  const requestedPage = Number.parseInt(req.query.page, 10)
  const currentPage = Number.isNaN(requestedPage)
    ? 1
    : Math.min(Math.max(requestedPage, 1), totalPages)

  const startIndex = (currentPage - 1) * pageSize
  const pagedLetters = filteredLetters.slice(startIndex, startIndex + pageSize)
  const paginationData = {
    items: buildPaginationItems(currentPage, totalPages, basePath, selectedFilter, searchTerm)
  }

  if (currentPage > 1) {
    paginationData.previous = { href: `${basePath}${buildQuery(currentPage - 1, selectedFilter, searchTerm)}` }
  }

  if (currentPage < totalPages) {
    paginationData.next = { href: `${basePath}${buildQuery(currentPage + 1, selectedFilter, searchTerm)}` }
  }

  return {
    letters: pagedLetters,
    paginationData,
    searchTerm,
    selectedFilter,
    totalPages
  }
}

function buildTabPaginationItems(currentPage, totalPages, basePath, tab, unreadPage, readPage) {
  const items = []

  for (let page = 1; page <= totalPages; page++) {
    const params = new URLSearchParams({
      tab,
      unreadPage: String(tab === 'unread' ? page : unreadPage),
      readPage: String(tab === 'read' ? page : readPage)
    })

    items.push({
      number: page,
      href: `${basePath}?${params.toString()}#${tab}-letters`,
      current: page === currentPage
    })
  }

  return items
}

function paginateLettersByStatus(req, basePath) {
  const pageSize = 5
  const activeTab = req.query.tab === 'read' ? 'read' : 'unread'

  const unreadLetters = letters.allLetters.filter((letter) => letter.status === 'unread')
  const readLetters = letters.allLetters.filter((letter) => letter.status === 'read')

  const unreadTotalPages = Math.max(1, Math.ceil(unreadLetters.length / pageSize))
  const readTotalPages = Math.max(1, Math.ceil(readLetters.length / pageSize))

  const requestedUnreadPage = Number.parseInt(req.query.unreadPage, 10)
  const requestedReadPage = Number.parseInt(req.query.readPage, 10)

  const unreadPage = Number.isNaN(requestedUnreadPage)
    ? 1
    : Math.min(Math.max(requestedUnreadPage, 1), unreadTotalPages)
  const readPage = Number.isNaN(requestedReadPage)
    ? 1
    : Math.min(Math.max(requestedReadPage, 1), readTotalPages)

  const unreadStartIndex = (unreadPage - 1) * pageSize
  const readStartIndex = (readPage - 1) * pageSize

  const pagedUnreadLetters = unreadLetters.slice(unreadStartIndex, unreadStartIndex + pageSize)
  const pagedReadLetters = readLetters.slice(readStartIndex, readStartIndex + pageSize)

  const unreadPaginationData = {
    items: buildTabPaginationItems(unreadPage, unreadTotalPages, basePath, 'unread', unreadPage, readPage)
  }
  const readPaginationData = {
    items: buildTabPaginationItems(readPage, readTotalPages, basePath, 'read', unreadPage, readPage)
  }

  if (unreadPage > 1) {
    const params = new URLSearchParams({
      tab: 'unread',
      unreadPage: String(unreadPage - 1),
      readPage: String(readPage)
    })
    unreadPaginationData.previous = { href: `${basePath}?${params.toString()}#unread-letters` }
  }

  if (unreadPage < unreadTotalPages) {
    const params = new URLSearchParams({
      tab: 'unread',
      unreadPage: String(unreadPage + 1),
      readPage: String(readPage)
    })
    unreadPaginationData.next = { href: `${basePath}?${params.toString()}#unread-letters` }
  }

  if (readPage > 1) {
    const params = new URLSearchParams({
      tab: 'read',
      unreadPage: String(unreadPage),
      readPage: String(readPage - 1)
    })
    readPaginationData.previous = { href: `${basePath}?${params.toString()}#read-letters` }
  }

  if (readPage < readTotalPages) {
    const params = new URLSearchParams({
      tab: 'read',
      unreadPage: String(unreadPage),
      readPage: String(readPage + 1)
    })
    readPaginationData.next = { href: `${basePath}?${params.toString()}#read-letters` }
  }

  return {
    activeTab,
    unreadLetters: pagedUnreadLetters,
    unreadPaginationData,
    unreadTotalPages,
    readLetters: pagedReadLetters,
    readPaginationData,
    readTotalPages
  }
}

function buildQueryByType(tab, outcomePage, appointmentPage, outcomeSearchTerm, appointmentSearchTerm) {
  const params = new URLSearchParams({
    tab,
    outcomePage: String(outcomePage),
    appointmentPage: String(appointmentPage)
  })

  if (outcomeSearchTerm) {
    params.set('outcomeSearch', outcomeSearchTerm)
  }

  if (appointmentSearchTerm) {
    params.set('appointmentSearch', appointmentSearchTerm)
  }

  return params
}

function buildTabPaginationItemsByType(currentPage, totalPages, basePath, tab, outcomePage, appointmentPage, outcomeSearchTerm, appointmentSearchTerm) {
  const items = []

  for (let page = 1; page <= totalPages; page++) {
    const params = buildQueryByType(
      tab,
      tab === 'outcome' ? page : outcomePage,
      tab === 'appointment' ? page : appointmentPage,
      outcomeSearchTerm,
      appointmentSearchTerm
    )

    items.push({
      number: page,
      href: `${basePath}?${params.toString()}#${tab}-letters`,
      current: page === currentPage
    })
  }

  return items
}

function paginateLettersByType(req, basePath) {
  const pageSize = 5
  const activeTab = req.query.tab === 'appointment' ? 'appointment' : 'outcome'

  const outcomeSearchTerm = typeof req.query.outcomeSearch === 'string' ? req.query.outcomeSearch.trim() : ''
  const appointmentSearchTerm = typeof req.query.appointmentSearch === 'string' ? req.query.appointmentSearch.trim() : ''
  const lowerCaseOutcomeSearchTerm = outcomeSearchTerm.toLowerCase()
  const lowerCaseAppointmentSearchTerm = appointmentSearchTerm.toLowerCase()

  let outcomeLetters = letters.outcomeLetters;
  let appointmentLetters = letters.appointmentLetters;

  if (lowerCaseOutcomeSearchTerm) {
    outcomeLetters = outcomeLetters.filter((letter) => (
      Object.values(letter).some((value) => String(value).toLowerCase().includes(lowerCaseOutcomeSearchTerm))
    ))
  }

  if (lowerCaseAppointmentSearchTerm) {
    appointmentLetters = appointmentLetters.filter((letter) => (
      Object.values(letter).some((value) => String(value).toLowerCase().includes(lowerCaseAppointmentSearchTerm))
    ))
  }

  const outcomeTotalPages = Math.max(1, Math.ceil(outcomeLetters.length / pageSize))
  const appointmentTotalPages = Math.max(1, Math.ceil(appointmentLetters.length / pageSize))

  const requestedOutcomePage = Number.parseInt(req.query.outcomePage, 10)
  const requestedAppointmentPage = Number.parseInt(req.query.appointmentPage, 10)

  const outcomePage = Number.isNaN(requestedOutcomePage)
    ? 1
    : Math.min(Math.max(requestedOutcomePage, 1), outcomeTotalPages)
  const appointmentPage = Number.isNaN(requestedAppointmentPage)
    ? 1
    : Math.min(Math.max(requestedAppointmentPage, 1), appointmentTotalPages)

  const outcomeStartIndex = (outcomePage - 1) * pageSize
  const appointmentStartIndex = (appointmentPage - 1) * pageSize

  const pagedOutcomeLetters = outcomeLetters.slice(outcomeStartIndex, outcomeStartIndex + pageSize)
  const pagedAppointmentLetters = appointmentLetters.slice(appointmentStartIndex, appointmentStartIndex + pageSize)

  const outcomePaginationData = {
    items: buildTabPaginationItemsByType(outcomePage, outcomeTotalPages, basePath, 'outcome', outcomePage, appointmentPage, outcomeSearchTerm, appointmentSearchTerm)
  }
  const appointmentPaginationData = {
    items: buildTabPaginationItemsByType(appointmentPage, appointmentTotalPages, basePath, 'appointment', outcomePage, appointmentPage, outcomeSearchTerm, appointmentSearchTerm)
  }

  if (outcomePage > 1) {
    const params = buildQueryByType('outcome', outcomePage - 1, appointmentPage, outcomeSearchTerm, appointmentSearchTerm)
    outcomePaginationData.previous = { href: `${basePath}?${params.toString()}#outcome-letters` }
  }

  if (outcomePage < outcomeTotalPages) {
    const params = buildQueryByType('outcome', outcomePage + 1, appointmentPage, outcomeSearchTerm, appointmentSearchTerm)
    outcomePaginationData.next = { href: `${basePath}?${params.toString()}#outcome-letters` }
  }

  if (appointmentPage > 1) {
    const params = buildQueryByType('appointment', outcomePage, appointmentPage - 1, outcomeSearchTerm, appointmentSearchTerm)
    appointmentPaginationData.previous = { href: `${basePath}?${params.toString()}#appointment-letters` }
  }

  if (appointmentPage < appointmentTotalPages) {
    const params = buildQueryByType('appointment', outcomePage, appointmentPage + 1, outcomeSearchTerm, appointmentSearchTerm)
    appointmentPaginationData.next = { href: `${basePath}?${params.toString()}#appointment-letters` }
  }

  return {
    activeTab,
    outcomeLetters: pagedOutcomeLetters,
    outcomePaginationData,
    outcomeTotalPages,
    outcomeSearchTerm,
    outcomePage,
    appointmentLetters: pagedAppointmentLetters,
    appointmentPaginationData,
    appointmentTotalPages,
    appointmentSearchTerm,
    appointmentPage
  }
}

module.exports = {
  paginateData,
  paginateLettersByStatus,
  paginateLettersByType
}

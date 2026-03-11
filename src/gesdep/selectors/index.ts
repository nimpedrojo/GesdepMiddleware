export const selectors = {
  login: {
    path: '/v3/login.aspx',
    username: '#txtNombre',
    password: '#txtContra',
    submit: '#btnEntrar',
    success: '#ctl00_lblUsuario'
  },
  teams: {
    path: '/v3/forms/competitions/frmEquipos.aspx',
    ready: '#ctl00_ContentPlaceHolder1_lblListaEqui',
    list: '#ctl00_ContentPlaceHolder1_lblListaEqui',
    item: '> div',
    link: '> a[href*="frmequipos.aspx?idequ="]',
    name: 'tr:first-child td:first-child',
    code: 'tr:first-child td:last-child',
    activePanelTitle: '#ctl00_ContentPlaceHolder1_lblEquipos',
    season: '#ctl00_lblTemporada',
    detailSummary: '#ctl00_ContentPlaceHolder1_lblDatos',
    detailPlayers: '#ctl00_ContentPlaceHolder1_lblListaJuga',
    detailPlayerRow: 'tr[onclick*="idjug="]',
    detailPlayerShortName: 'td:nth-child(2) > div:first-child',
    detailPlayerFullName: 'td:nth-child(2) > div:nth-child(2)'
  }
};

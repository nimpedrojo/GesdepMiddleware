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
    season: '#ctl00_lblTemporada'
  }
};

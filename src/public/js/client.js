$(document).ready(function () {
    // Manejar el clic en el botón de cierre de sesión
    $("#logoutButton").click(function () {
      // Realizar una solicitud al servidor para cerrar la sesión
      $.post("/logout", function (data) {
        // Redirigir al usuario a la página de inicio de sesión u otra página deseada
        window.location.href = "/inicio-sesion";
      });
    });
  });
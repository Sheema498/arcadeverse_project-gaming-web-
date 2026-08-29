/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 5
 * Procedurally defined layout vectors coordinates.
 */

const Level_5_Data = {
    id: 5,
    bg: '#181205',
    grid: [
        "       #             #   C     #            CE     #               C           C  C    E ^ C                 #  #         #    C      #     C         ",
        "       C       #        # C    #                           #E  E                                 C     ^             ^   E E  C                       ",
        "                     #    C                  #       C    C         ^           #                             #C  #  #  #                             ",
        "     #     C                    C       E#       E    E               C  C   C                         #                     ^       #C               ",
        "          # C                       #        ^   C                     C          #     #   #                      #         E                        ",
        "     C     C     #    #             C     C      E  #     #                       C  #     #                      C  C#   ## #   #     E              ",
        "                  E                       E     #             #                 C  E      C     C   E           E                                     ",
        "               E                           #        #  E  #         ##                                        CC C        C            C#             ",
        "            #   C E E             #            C     E              C            C C                #     C      #    E#   E  E            #          ",
        "                  E         #   C    C             E       C     E                  C         E       C           #   C    #  #                       ",
        "        #       E     C             C   #        #C              C   E        CE ^         #C  C      ##  #    E       C CE     #    #                ",
        "      C #           #        C        #             C            #    ^# ##      #    #    ^    E    C   # E        #       C      #    C             ",
        "           ^                          C    C           C    #                   E     #    ^      C               C         #      E   C              ",
        "  S               #                C                                C                   # C    ^                                         #    Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_5_Data);
